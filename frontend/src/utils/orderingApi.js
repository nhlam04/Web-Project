const ORDERING_BASE_URL = process.env.REACT_APP_ORDERING_URL || 'http://localhost:8083';
const CART_STORAGE_KEY = 'ordering_cart_id';
const DEMO_USER_ID = 'user-demo-001';

function formatVnd(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || 'Khong the ket noi Ordering Service';
    throw new Error(message);
  }
  return payload.data;
}

async function createCart() {
  const response = await fetch(`${ORDERING_BASE_URL}/api/v1/carts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: DEMO_USER_ID, currency: 'VND' }),
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
  return product.sellerId || product.seller_id || 'seller-unknown';
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
      name: product.name || 'Unknown item',
      quantity,
      unitPrice: resolveUnitPrice(product),
    }),
  });

  return parseResponse(response);
}

export {
  ORDERING_BASE_URL,
  CART_STORAGE_KEY,
  DEMO_USER_ID,
  formatVnd,
  createCart,
  getCart,
  getOrCreateCart,
  addProductToCart,
};
