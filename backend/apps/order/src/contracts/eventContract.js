const config = require("../config");

const ORDER_EVENT_ROUTING = {
  OrderPlaced: "order.placed",
  OrderCancelled: "order.cancelled",
  OrderStatusUpdated: "order.status_updated",
  "order.created": "order.placed",
  "order.cancelled": "order.cancelled",
  "order.status.updated": "order.status_updated",
};

const FULFILLMENT_EVENT_ALIASES = {
  SellerOrderConfirmed: "fulfillment.seller_order_confirmed",
  "fulfillment.seller-confirmed": "fulfillment.seller_order_confirmed",
  "fulfillment.seller-order-confirmed": "fulfillment.seller_order_confirmed",
  DeliveryUpdated: "fulfillment.delivery_updated",
  "fulfillment.delivery.updated": "fulfillment.delivery_updated",
  "fulfillment.status-updated": "fulfillment.delivery_updated",
  OrderCompleted: "fulfillment.order_completed",
  "fulfillment.completed": "fulfillment.order_completed",
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
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    currency: order.currency,
    totals: order.totals,
    items: order.items.map((item) => ({
      productId: item.productId,
      sellerId: item.sellerId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
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
