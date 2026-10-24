import axios from 'axios';
import { ENDPOINTS } from './endpoints';

// Create central Axios instance pointing to Spring Cloud Gateway
export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Refresh token queue to prevent race condition storms during concurrent 401s
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Bearer Access Token
axiosClient.interceptors.request.use(
  (config) => {
    try {
      const authStorage = localStorage.getItem('zomatwo-auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        const token = parsed?.state?.accessToken;
        // Only attach if it's a real JWT (not local demo token)
        if (token && !token.startsWith('demo_') && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      console.error('Failed to parse auth token from localStorage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Silent Refresh with Queue Lock
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401 Unauthorized if not already retried and not the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(ENDPOINTS.AUTH.REFRESH) &&
      !originalRequest.url?.includes(ENDPOINTS.AUTH.LOGIN)
    ) {
      try {
        const authStorage = localStorage.getItem('zomatwo-auth-storage');
        const parsed = authStorage ? JSON.parse(authStorage) : null;
        const rawRefreshToken = parsed?.state?.refreshToken;

        // Skip redirect if using demo token
        if (!rawRefreshToken || rawRefreshToken.startsWith('demo_')) {
          return Promise.reject(error);
        }

        if (isRefreshing) {
          // Enqueue pending request while refresh is in flight
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axiosClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        // Call silent refresh endpoint
        const response = await axios.post(
          `${axiosClient.defaults.baseURL}${ENDPOINTS.AUTH.REFRESH}`,
          { refreshToken: rawRefreshToken }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Update Zustand persisted state in localStorage
        if (parsed?.state) {
          parsed.state.accessToken = newAccessToken;
          if (newRefreshToken) parsed.state.refreshToken = newRefreshToken;
          localStorage.setItem('zomatwo-auth-storage', JSON.stringify(parsed));
        }

        // Replay original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Only redirect to login if not in a demo session
        const authStorage = localStorage.getItem('zomatwo-auth-storage');
        const parsed = authStorage ? JSON.parse(authStorage) : null;
        if (!parsed?.state?.refreshToken?.startsWith('demo_')) {
          localStorage.removeItem('zomatwo-auth-storage');
          if (window.location.pathname !== '/auth/login') {
            window.location.href = '/auth/login?sessionExpired=true';
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
