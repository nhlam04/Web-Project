const config = require("../config");

const ORDER_EVENT_ROUTING = {
  "order.created": "order.created",
  "order.cancelled": "order.cancelled",
  "order.status.updated": "order.status.updated",
};

const FULFILLMENT_EVENT_ALIASES = {
  SellerOrderConfirmed: "fulfillment.seller-order-confirmed",
  "fulfillment.seller-confirmed": "fulfillment.seller-order-confirmed",
  DeliveryUpdated: "fulfillment.status-updated",
  "fulfillment.delivery.updated": "fulfillment.status-updated",
  OrderCompleted: "fulfillment.completed",
};

function canonicalizeFulfillmentEventName(eventName) {
  return FULFILLMENT_EVENT_ALIASES[eventName] || eventName || "unknown";
}

function getOrderRoutingMetadata(eventType) {
  return {
    exchangeName: config.rabbitmq.exchange,
    routingKey: ORDER_EVENT_ROUTING[eventType] || "order.unknown",
  };
}

function buildOrderCreatedPayload(order) {
  return {
    orderId: order.id,
    customerId: order.userId,
    sellerId: order.items[0]?.sellerId || "unknown-seller",
    items: order.items.map((item) => ({
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity,
      price: item.unitPrice,
    })),
    totalAmount: order.totals.subtotal,
  };
}

function buildOrderCancelledPayload(order, reason, cancelledAt) {
  return {
    orderId: order.id,
    customerId: order.userId,
    reason,
    cancelledAt,
  };
}

function buildOrderStatusUpdatedPayload(orderId, fromStatus, toStatus, changedAt, sourceEventType) {
  return {
    orderId,
    fromStatus,
    toStatus,
    changedAt,
    sourceEventType: sourceEventType || null,
  };
}

function resolveInboundEventId(message, routingKey) {
  if (message.eventId || message.id) {
    return message.eventId || message.id;
  }

  const payload = message.data || message.payload || message;
  return `${routingKey}:${message.eventType || message.eventName || message.type || "unknown"}:${payload.orderId || "unknown"}`;
}

function normalizeFulfillmentEvent(message, routingKey) {
  if (!message || typeof message !== "object") {
    return null;
  }

  const eventType = canonicalizeFulfillmentEventName(message.eventType || message.eventName || message.type || routingKey);

  let data = message.data;
  if (!data || typeof data !== "object") {
    data = message.payload;
  }
  if (!data || typeof data !== "object") {
    data = message;
  }

  if (!data || !data.orderId) {
    return null;
  }

  return {
    eventId: resolveInboundEventId(message, routingKey),
    eventType,
    routingKey,
    data,
  };
}

module.exports = {
  canonicalizeFulfillmentEventName,
  buildOrderCreatedPayload,
  buildOrderCancelledPayload,
  buildOrderStatusUpdatedPayload,
  getOrderRoutingMetadata,
  normalizeFulfillmentEvent,
  resolveInboundEventId,
};
