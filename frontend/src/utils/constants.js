const env = import.meta.env;

export const API_BASES = {
  auth: env.VITE_AUTH_URL || '/api/auth',
  catalog: env.VITE_CATALOG_URL || '/api/catalog',
  ordering: env.VITE_ORDERING_URL || '/api/ordering',
  fulfillment: env.VITE_FULFILLMENT_URL || '/api/fulfillment',
  notification: env.VITE_NOTIFICATION_URL || '/api/notification',
  review: env.VITE_REVIEW_URL || '/api/reviews',
  chatHttp: env.VITE_CHAT_API_URL || 'http://localhost:8000',
  chatWs: env.VITE_CHAT_WS_URL || 'ws://localhost:8000',
};

export const STORAGE_KEYS = {
  accessToken: 'auth_access_token',
  refreshToken: 'auth_refresh_token',
  user: 'auth_user',
  cart: 'ordering_cart_id',
};

export const DEMO_USER_ID = 'user-demo-001';
export const DEMO_SELLER_ID = 'seller-001';
