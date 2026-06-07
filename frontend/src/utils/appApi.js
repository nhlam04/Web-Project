import { API_BASES } from './constants';

const AUTH_BASE_URL = API_BASES.auth;
const ORDERING_BASE_URL = API_BASES.ordering;
const FULFILLMENT_BASE_URL = API_BASES.fulfillment;
const NOTIFICATION_BASE_URL = API_BASES.notification;
const REVIEW_BASE_URL = API_BASES.review;

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';
const CART_STORAGE_KEY = 'ordering_cart_id';
const DEMO_USER_ID = 'user-demo-001';
const DEMO_SELLER_ID = 'seller-001';

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function getActiveUserId() {
  return getStoredUser()?.id || DEMO_USER_ID;
}

function authHeaders(extra = {}) {
  const token = getAccessToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseApiResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.error || payload?.message || fallbackMessage);
  }
  return Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
}

async function register(username, password, role = 'CUSTOMER') {
  const response = await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  });
  return parseApiResponse(response, 'Không thể đăng ký tài khoản');
}

async function login(username, password) {
  const response = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const payload = await parseApiResponse(response, 'Không thể đăng nhập');
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  localStorage.removeItem(CART_STORAGE_KEY);
  return getProfile();
}

async function getProfile() {
  const response = await fetch(`${AUTH_BASE_URL}/me`, {
    headers: authHeaders(),
  });
  const payload = await parseApiResponse(response, 'Không thể tải thông tin người dùng');
  localStorage.setItem(USER_KEY, JSON.stringify(payload));
  return payload;
}

async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  const response = await fetch(`${AUTH_BASE_URL}/change-password`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
  return parseApiResponse(response, 'Không thể đổi mật khẩu');
}

function logout() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(CART_STORAGE_KEY);
}

async function listOrders(userId = getActiveUserId()) {
  const response = await fetch(`${ORDERING_BASE_URL}/api/v1/orders?userId=${encodeURIComponent(userId)}`, {
    headers: authHeaders(),
  });
  return parseApiResponse(response, 'Không thể tải danh sách đơn hàng');
}

async function getOrder(orderId) {
  const response = await fetch(`${ORDERING_BASE_URL}/api/v1/orders/${orderId}`, {
    headers: authHeaders(),
  });
  return parseApiResponse(response, 'Không thể tải đơn hàng');
}

async function cancelOrder(orderId, reason) {
  const response = await fetch(`${ORDERING_BASE_URL}/api/v1/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ reason }),
  });
  return parseApiResponse(response, 'Không thể hủy đơn hàng');
}

async function listFulfillmentsByOrder(orderId) {
  const response = await fetch(`${FULFILLMENT_BASE_URL}/fulfillments?orderId=${encodeURIComponent(orderId)}`);
  return parseApiResponse(response, 'Không thể tải thông tin gi?o hàng');
}

async function listSellerOrders({ sellerId = DEMO_SELLER_ID, status = '' } = {}) {
  const params = new URLSearchParams({ sellerId, page: '1', limit: '50' });
  if (status) params.set('status', status);
  const response = await fetch(`${FULFILLMENT_BASE_URL}/seller/orders?${params.toString()}`, {
    headers: { 'x-seller-id': sellerId },
  });
  return parseApiResponse(response, 'Không thể tải đơn hàng người bán');
}

async function updateSellerOrder(id, action, body = {}, sellerId = DEMO_SELLER_ID) {
  const response = await fetch(`${FULFILLMENT_BASE_URL}/seller/orders/${id}/${action}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-seller-id': sellerId },
    body: JSON.stringify(body),
  });
  return parseApiResponse(response, 'Không thể cập nhật đơn hàng người bán');
}

async function listNotifications(userId = getActiveUserId(), unreadOnly = false) {
  const params = new URLSearchParams({ userId, skip: '0', limit: '50' });
  if (unreadOnly) params.set('unreadOnly', 'true');
  const response = await fetch(`${NOTIFICATION_BASE_URL}/api/v1/notifications?${params.toString()}`, {
    headers: authHeaders(),
  });
  return parseApiResponse(response, 'Không thể tải thông báo');
}

async function markNotificationRead(notificationId) {
  const response = await fetch(`${NOTIFICATION_BASE_URL}/api/v1/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  return parseApiResponse(response, 'Không thể đánh dấu thông báo đã đọc');
}

async function markAllNotificationsRead(userId = getActiveUserId()) {
  const response = await fetch(`${NOTIFICATION_BASE_URL}/api/v1/notifications/read-all?userId=${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  return parseApiResponse(response, 'Không thể đánh dấu tất cả thông báo đã đọc');
}

async function listProductReviews(productId) {
  const response = await fetch(`${REVIEW_BASE_URL}?productId=${encodeURIComponent(productId)}`, {
    headers: authHeaders(),
  });
  return parseApiResponse(response, 'Không thể tải đánh giá sản phẩm');
}

async function getReviewEligibility({ customerId, orderId, productId }) {
  const params = new URLSearchParams({ customerId, orderId, productId });
  const response = await fetch(`${REVIEW_BASE_URL}/eligibility?${params.toString()}`, {
    headers: authHeaders(),
  });
  return parseApiResponse(response, 'Không thể kiểm tra quyền đánh giá');
}

async function submitReview(payload) {
  const response = await fetch(REVIEW_BASE_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return parseApiResponse(response, 'Không thể gửi đánh giá');
}

export {
  ACCESS_TOKEN_KEY,
  DEMO_SELLER_ID,
  DEMO_USER_ID,
  cancelOrder,
  changePassword,
  getActiveUserId,
  getOrder,
  getProfile,
  getReviewEligibility,
  getStoredUser,
  listFulfillmentsByOrder,
  listNotifications,
  listOrders,
  listProductReviews,
  listSellerOrders,
  login,
  logout,
  markAllNotificationsRead,
  markNotificationRead,
  register,
  submitReview,
  updateSellerOrder,
};
