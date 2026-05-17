const store = require("../store/memoryStore");

function cartNotFound(cartId) {
  const err = new Error(`Cart not found: ${cartId}`);
  err.status = 404;
  err.code = "CART_NOT_FOUND";
  return err;
}

function assertActiveCart(cart) {
  if (cart.status !== "ACTIVE") {
    const err = new Error("Cart is not active");
    err.status = 409;
    err.code = "INVALID_CART_STATUS";
    throw err;
  }
}

function recalculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, totalQuantity };
}

async function createCart(input) {
  return store.createCart(input);
}

async function getCart(cartId) {
  const cart = await store.getCart(cartId);
  if (!cart) {
    throw cartNotFound(cartId);
  }
  return cart;
}

async function addCartItem(cartId, itemInput) {
  const cart = await getCart(cartId);
  assertActiveCart(cart);

  const existingIdx = cart.items.findIndex((item) => item.productId === itemInput.productId);

  let nextItems;
  if (existingIdx >= 0) {
    nextItems = cart.items.map((item, idx) =>
      idx === existingIdx
        ? {
            ...item,
            quantity: item.quantity + itemInput.quantity,
            unitPrice: itemInput.unitPrice,
            sellerId: itemInput.sellerId,
            name: itemInput.name,
          }
        : item,
    );
  } else {
    nextItems = [...cart.items, itemInput];
  }

  const totals = recalculateTotals(nextItems);
  const next = await store.replaceCartItems(cartId, nextItems, totals);

  return next;
}

async function updateCartItem(cartId, productId, quantity) {
  const cart = await getCart(cartId);
  assertActiveCart(cart);

  const existing = cart.items.some((item) => item.productId === productId);
  if (!existing) {
    const err = new Error(`Product not found in cart: ${productId}`);
    err.status = 404;
    err.code = "CART_ITEM_NOT_FOUND";
    throw err;
  }

  const nextItems = quantity === 0
    ? cart.items.filter((item) => item.productId !== productId)
    : cart.items.map((item) => (item.productId === productId ? { ...item, quantity } : item));

  const totals = recalculateTotals(nextItems);
  const next = await store.replaceCartItems(cartId, nextItems, totals);

  return next;
}

module.exports = {
  createCart,
  getCart,
  addCartItem,
  updateCartItem,
  recalculateTotals,
};
