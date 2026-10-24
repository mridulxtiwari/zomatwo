import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,

      setAuth: (authData) => {
        set({
          user: authData.user,
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          role: authData.user?.role || null,
          isAuthenticated: !!authData.accessToken,
        });
      },

      updateAccessToken: (accessToken, refreshToken) => {
        set((state) => ({
          accessToken,
          refreshToken: refreshToken || state.refreshToken,
          isAuthenticated: !!accessToken,
        }));
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          role: null,
          isAuthenticated: false,
        });
        localStorage.removeItem('zomatwo-auth-storage');
      },

      checkIsAuthenticated: () => {
        return !!get().accessToken;
      },

      isCustomer: () => {
        return get().role === 'ROLE_CUSTOMER';
      },

      isRestaurantOwner: () => {
        return get().role === 'ROLE_RESTAURANT_OWNER';
      },
    }),
    {
      name: 'zomatwo-auth-storage',
    }
  )
);
