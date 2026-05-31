import { formatPrice } from './formatters';

const ORDERING_BASE_URL = process.env.REACT_APP_ORDERING_URL || 'http://localhost:8083';
const CART_STORAGE_KEY = 'ordering_cart_id';
const DEMO_USER_ID = 'user-demo-001';
const USER_STORAGE_KEY = 'auth_user';

function getOrderingUserId() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return DEMO_USER_ID;
  }
  try {
    return JSON.parse(raw)?.id || DEMO_USER_ID;
  } catch (_error) {
    return DEMO_USER_ID;
  }
}

function formatVnd(value) {
  return formatPrice(value);
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || 'Không thể kết nối Ordering Service';
    throw new Error(message);
  }
  return payload.data;
}

async function createCart() {
  const response = await fetch(`${ORDERING_BASE_URL}/api/v1/carts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: getOrderingUserId(), currency: 'VND' }),
  });

  const cart = await parseResponse(response);
  localStorage.setItem(CART_STORAGE_KEY, cart.id);
  return cart;
}

async function getCart(cartId) {
  const response = await fetch(`${ORDERING_BASE_URL}/api/v1/carts/${cartId}`);
  return parseResponse(response);
}

async function getOrCreateCart() {
  const storedCartId = localStorage.getItem(CART_STORAGE_KEY);

  if (storedCartId) {
    try {
      return await getCart(storedCartId);
    } catch (_error) {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }

  return createCart();
}

function resolveSellerId(product) {
  return String(product.sellerId || product.seller_id || product.shopId || 'seller-unknown');
}

function resolveUnitPrice(product) {
  if (typeof product.unitPrice === 'number') {
    return product.unitPrice;
  }
  if (typeof product.price === 'number') {
    return product.price;
  }
  const fallback = Number(product.price || 0);
  return Number.isFinite(fallback) ? fallback : 0;
}

async function addProductToCart(cartId, product, quantity = 1) {
  const response = await fetch(`${ORDERING_BASE_URL}/api/v1/carts/${cartId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: String(product.id || product.productId),
      sellerId: resolveSellerId(product),
      name: product.name || 'Sản phẩm không rõ',
      quantity,
      unitPrice: resolveUnitPrice(product),
    }),
  });

  return parseResponse(response);
}

async function updateCartItemQuantity(cartId, productId, quantity) {
  const response = await fetch(`${ORDERING_BASE_URL}/api/v1/carts/${cartId}/items/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });

  return parseResponse(response);
}

async function removeCartItem(cartId, productId) {
  const response = await fetch(`${ORDERING_BASE_URL}/api/v1/carts/${cartId}/items/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });

  return parseResponse(response);
}

async function checkoutCart(cartId) {
  const response = await fetch(`${ORDERING_BASE_URL}/api/v1/orders/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: getOrderingUserId(),
      cartId,
      shippingAddress: {
        recipientName: 'Người dùng demo',
        phone: '0900000000',
        line1: '123 Nguyen Trai',
        ward: 'Phường 1',
        district: 'Quận 1',
        city: 'Thành phố Hồ Chí Minh',
        country: 'VN',
      },
      paymentMethod: 'COD',
    }),
  });

  const result = await parseResponse(response);
  localStorage.removeItem(CART_STORAGE_KEY);
  return result;
}

export {
  ORDERING_BASE_URL,
  CART_STORAGE_KEY,
  DEMO_USER_ID,
  getOrderingUserId,
  formatVnd,
  createCart,
  getCart,
  getOrCreateCart,
  addProductToCart,
  updateCartItemQuantity,
  removeCartItem,
  checkoutCart,
};
