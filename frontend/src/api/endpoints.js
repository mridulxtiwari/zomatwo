// Centralized API endpoints routing through Spring Cloud Gateway (Port 8080)
export const ENDPOINTS = {
  // Auth & Identity (identity-service:8081)
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    ME: '/users/me',
    ADDRESSES: '/users/me/addresses',
  },

  // Catalog & Menus (catalog-service:8082)
  CATALOG: {
    RESTAURANTS: '/restaurants',
    RESTAURANT_BY_ID: (id) => `/restaurants/${id}`,
    PARTNER_RESTAURANTS: '/partner/catalog/restaurants',
    PARTNER_ADD_ITEM: (restaurantId) => `/partner/catalog/restaurants/${restaurantId}/items`,
    PARTNER_TOGGLE_ITEM: (itemId) => `/partner/catalog/items/${itemId}/availability`,
  },

  // Orders & Saga (order-service:8083)
  ORDERS: {
    CALCULATE_BILL: '/orders/calculate-bill',
    PLACE_ORDER: '/orders',
    CREATE: '/orders',
    CUSTOMER_ORDERS: '/orders',
    ORDER_BY_ID: (id) => `/orders/${id}`,
    PARTNER_ORDER_STATUS: (id) => `/partner/orders/${id}/status`,
    PARTNER_ORDER_REJECT: (id) => `/partner/orders/${id}/reject`,
  },

  // Payments (payment-service:8084)
  PAYMENTS: {
    VERIFY: '/payments/verify',
  },

  // Realtime Streaming (realtime-service:8085)
  REALTIME: {
    ORDER_STREAM: (orderId) => `/stream/orders/${orderId}`,
  },
};
