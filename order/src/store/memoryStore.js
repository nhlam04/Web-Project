const { randomUUID } = require("crypto");

const carts = new Map();
const orders = new Map();
const outboxEvents = [];

function nowIso() {
  return new Date().toISOString();
}

function createCart({ userId, currency = "VND" }) {
  const cart = {
    id: randomUUID(),
    userId,
    currency,
    status: "ACTIVE",
    items: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    checkedOutAt: null,
  };

  carts.set(cart.id, cart);
  return cart;
}

function getCart(cartId) {
  return carts.get(cartId) || null;
}

function updateCart(cartId, updater) {
  const current = getCart(cartId);
  if (!current) {
    return null;
  }

  const updated = {
    ...updater(current),
    updatedAt: nowIso(),
  };

  carts.set(cartId, updated);
  return updated;
}

function saveOrder(order) {
  orders.set(order.id, order);
  return order;
}

function getOrder(orderId) {
  return orders.get(orderId) || null;
}

function updateOrder(orderId, updater) {
  const current = getOrder(orderId);
  if (!current) {
    return null;
  }

  const updated = {
    ...updater(current),
    updatedAt: nowIso(),
  };

  orders.set(orderId, updated);
  return updated;
}

function listOrdersByUser(userId) {
  return Array.from(orders.values()).filter((order) => order.userId === userId);
}

function pushOutboxEvent(event) {
  const outbox = {
    id: randomUUID(),
    aggregateType: "ORDER",
    aggregateId: event.aggregateId,
    eventType: event.eventType,
    payload: event.payload,
    status: "PENDING",
    createdAt: nowIso(),
    publishedAt: null,
  };

  outboxEvents.push(outbox);
  return outbox;
}

function listOutboxPending() {
  return outboxEvents.filter((event) => event.status === "PENDING");
}

function markOutboxPublished(outboxId) {
  const idx = outboxEvents.findIndex((event) => event.id === outboxId);
  if (idx < 0) {
    return null;
  }

  outboxEvents[idx] = {
    ...outboxEvents[idx],
    status: "PUBLISHED",
    publishedAt: nowIso(),
  };

  return outboxEvents[idx];
}

module.exports = {
  createCart,
  getCart,
  updateCart,
  saveOrder,
  getOrder,
  updateOrder,
  listOrdersByUser,
  pushOutboxEvent,
  listOutboxPending,
  markOutboxPublished,
};
