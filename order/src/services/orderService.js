const { randomUUID } = require("crypto");
const store = require("../store/memoryStore");
const { ORDER_STATUS, assertCanTransition } = require("../domain/orderStateMachine");
const { recalculateTotals } = require("./cartService");

function orderNotFound(orderId) {
  const err = new Error(`Order not found: ${orderId}`);
  err.status = 404;
  err.code = "ORDER_NOT_FOUND";
  return err;
}

function createOrderFromCart({ cartId, userId, shippingAddress, paymentMethod }) {
  const cart = store.getCart(cartId);

  if (!cart) {
    const err = new Error(`Cart not found: ${cartId}`);
    err.status = 404;
    err.code = "CART_NOT_FOUND";
    throw err;
  }

  if (cart.status !== "ACTIVE") {
    const err = new Error("Cart is already checked out");
    err.status = 409;
    err.code = "INVALID_CART_STATUS";
    throw err;
  }

  if (!cart.items.length) {
    const err = new Error("Cannot place order from empty cart");
    err.status = 400;
    err.code = "EMPTY_CART";
    throw err;
  }

  const totals = recalculateTotals(cart.items);
  const createdAt = new Date().toISOString();

  const order = {
    id: randomUUID(),
    userId,
    cartId,
    status: ORDER_STATUS.PLACED,
    shippingAddress,
    paymentMethod,
    currency: cart.currency,
    items: cart.items.map((item) => ({
      productId: item.productId,
      sellerId: item.sellerId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.quantity * item.unitPrice,
    })),
    totals,
    createdAt,
    updatedAt: createdAt,
    history: [
      {
        from: null,
        to: ORDER_STATUS.PLACED,
        at: createdAt,
        by: "SYSTEM",
        reason: "Order created from cart checkout",
      },
    ],
  };

  store.saveOrder(order);

  store.updateCart(cartId, (current) => ({
    ...current,
    status: "CHECKED_OUT",
    checkedOutAt: createdAt,
  }));

  store.pushOutboxEvent({
    aggregateId: order.id,
    eventType: "OrderPlaced",
    payload: {
      orderId: order.id,
      userId: order.userId,
      items: order.items,
      totals: order.totals,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      createdAt,
    },
  });

  return order;
}

function getOrder(orderId) {
  const order = store.getOrder(orderId);
  if (!order) {
    throw orderNotFound(orderId);
  }
  return order;
}

function listOrdersByUser(userId) {
  return store.listOrdersByUser(userId);
}

function cancelOrder(orderId, reason = "Cancelled by user") {
  const order = getOrder(orderId);

  assertCanTransition(order.status, ORDER_STATUS.CANCELLED);

  const cancelledAt = new Date().toISOString();

  const next = store.updateOrder(orderId, (current) => ({
    ...current,
    status: ORDER_STATUS.CANCELLED,
    cancelledAt,
    history: [
      ...current.history,
      {
        from: current.status,
        to: ORDER_STATUS.CANCELLED,
        at: cancelledAt,
        by: "ORDER_SERVICE",
        reason,
      },
    ],
  }));

  store.pushOutboxEvent({
    aggregateId: next.id,
    eventType: "OrderCancelled",
    payload: {
      orderId: next.id,
      userId: next.userId,
      reason,
      cancelledAt,
    },
  });

  return next;
}

function transitionOrderStatus(orderId, toStatus, metadata = {}) {
  const order = getOrder(orderId);
  assertCanTransition(order.status, toStatus);

  const changedAt = new Date().toISOString();

  const next = store.updateOrder(orderId, (current) => ({
    ...current,
    status: toStatus,
    history: [
      ...current.history,
      {
        from: current.status,
        to: toStatus,
        at: changedAt,
        by: metadata.by || "INTEGRATION",
        reason: metadata.reason || "Status updated",
        sourceEventType: metadata.sourceEventType || null,
      },
    ],
  }));

  store.pushOutboxEvent({
    aggregateId: next.id,
    eventType: "OrderStatusUpdated",
    payload: {
      orderId: next.id,
      fromStatus: order.status,
      toStatus,
      changedAt,
      sourceEventType: metadata.sourceEventType || null,
    },
  });

  return next;
}

function applyFulfillmentEvent(event) {
  if (!event || typeof event !== "object") {
    const err = new Error("Invalid fulfillment event payload");
    err.status = 400;
    err.code = "INVALID_EVENT_PAYLOAD";
    throw err;
  }

  const { eventType, data } = event;

  if (!data || !data.orderId) {
    const err = new Error("Missing orderId in fulfillment event data");
    err.status = 400;
    err.code = "INVALID_EVENT_PAYLOAD";
    throw err;
  }

  if (eventType === "SellerOrderConfirmed") {
    return transitionOrderStatus(data.orderId, ORDER_STATUS.SELLER_CONFIRMED, {
      by: "FULFILLMENT_SERVICE",
      reason: "Seller confirmed order",
      sourceEventType: eventType,
    });
  }

  if (eventType === "DeliveryUpdated") {
    if (data.deliveryStatus === "IN_TRANSIT") {
      return transitionOrderStatus(data.orderId, ORDER_STATUS.IN_DELIVERY, {
        by: "FULFILLMENT_SERVICE",
        reason: "Delivery is in transit",
        sourceEventType: eventType,
      });
    }

    if (data.deliveryStatus === "DELIVERED") {
      return transitionOrderStatus(data.orderId, ORDER_STATUS.DELIVERED, {
        by: "FULFILLMENT_SERVICE",
        reason: "Delivery completed to customer",
        sourceEventType: eventType,
      });
    }

    return getOrder(data.orderId);
  }

  if (eventType === "OrderCompleted") {
    return transitionOrderStatus(data.orderId, ORDER_STATUS.COMPLETED, {
      by: "FULFILLMENT_SERVICE",
      reason: "Order completed by fulfillment",
      sourceEventType: eventType,
    });
  }

  const err = new Error(`Unsupported fulfillment event type: ${eventType}`);
  err.status = 400;
  err.code = "UNSUPPORTED_EVENT_TYPE";
  throw err;
}

function listPendingOutbox() {
  return store.listOutboxPending();
}

function markOutboxPublished(outboxId) {
  const outbox = store.markOutboxPublished(outboxId);
  if (!outbox) {
    const err = new Error(`Outbox event not found: ${outboxId}`);
    err.status = 404;
    err.code = "OUTBOX_NOT_FOUND";
    throw err;
  }
  return outbox;
}

module.exports = {
  createOrderFromCart,
  getOrder,
  listOrdersByUser,
  cancelOrder,
  applyFulfillmentEvent,
  listPendingOutbox,
  markOutboxPublished,
};
