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

function createCart(input) {
  return store.createCart(input);
}

function getCart(cartId) {
  const cart = store.getCart(cartId);
  if (!cart) {
    throw cartNotFound(cartId);
  }
  return cart;
}

function addCartItem(cartId, itemInput) {
  const cart = getCart(cartId);
  assertActiveCart(cart);

  const next = store.updateCart(cartId, (current) => {
    const existingIdx = current.items.findIndex((item) => item.productId === itemInput.productId);

    let nextItems;
    if (existingIdx >= 0) {
      nextItems = current.items.map((item, idx) =>
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
      nextItems = [...current.items, itemInput];
    }

    return {
      ...current,
      items: nextItems,
      totals: recalculateTotals(nextItems),
    };
  });

  return next;
}

function updateCartItem(cartId, productId, quantity) {
  const cart = getCart(cartId);
  assertActiveCart(cart);

  const next = store.updateCart(cartId, (current) => {
    const existing = current.items.some((item) => item.productId === productId);
    if (!existing) {
      const err = new Error(`Product not found in cart: ${productId}`);
      err.status = 404;
      err.code = "CART_ITEM_NOT_FOUND";
      throw err;
    }

    const nextItems = quantity === 0
      ? current.items.filter((item) => item.productId !== productId)
      : current.items.map((item) => (item.productId === productId ? { ...item, quantity } : item));

    return {
      ...current,
      items: nextItems,
      totals: recalculateTotals(nextItems),
    };
  });

  return next;
}

module.exports = {
  createCart,
  getCart,
  addCartItem,
  updateCartItem,
  recalculateTotals,
};
