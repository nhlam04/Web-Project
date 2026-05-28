const EVENT_ALIASES = {
  OrderPlaced: 'order.placed',
  OrderCancelled: 'order.cancelled',
  OrderStatusUpdated: 'order.status_updated',
  SellerOrderConfirmed: 'fulfillment.seller_order_confirmed',
  'fulfillment.seller-confirmed': 'fulfillment.seller_order_confirmed',
  'fulfillment.seller-order-confirmed': 'fulfillment.seller_order_confirmed',
  DeliveryUpdated: 'fulfillment.delivery_updated',
  'fulfillment.delivery.updated': 'fulfillment.delivery_updated',
  'fulfillment.status-updated': 'fulfillment.delivery_updated',
  OrderCompleted: 'fulfillment.order_completed',
  'fulfillment.completed': 'fulfillment.order_completed',
};

function canonicalizeEventName(eventName) {
  return EVENT_ALIASES[eventName] || eventName || 'unknown';
}

function buildNotificationContent(eventName, payload) {
  if (eventName === 'order.placed') {
    return {
      title: 'Order placed',
      body: `Order ${payload.orderId} was created.`,
    };
  }

  if (eventName === 'order.cancelled') {
    return {
      title: 'Order cancelled',
      body: `Order ${payload.orderId} was cancelled.`,
    };
  }

  if (eventName === 'order.status_updated') {
    return {
      title: 'Order status updated',
      body: `Order ${payload.orderId} moved to ${payload.toStatus}.`,
    };
  }

  if (eventName === 'fulfillment.seller_order_confirmed') {
    return {
      title: 'Seller confirmed order',
      body: `Seller confirmed order ${payload.orderId}.`,
    };
  }

  if (eventName === 'fulfillment.delivery_updated') {
    return {
      title: 'Delivery update',
      body: `Order ${payload.orderId} status is ${payload.newStatus || payload.status}.`,
    };
  }

  if (eventName === 'fulfillment.order_completed') {
    return {
      title: 'Order completed',
      body: `Order ${payload.orderId} is completed.`,
    };
  }

  if (eventName === 'review.created') {
    return {
      title: 'Review created',
      body: `Review ${payload.reviewId} was submitted.`,
    };
  }

  if (eventName === 'chat.message.sent') {
    return {
      title: 'New message',
      body: 'You have a new message.',
    };
  }

  if (eventName === 'catalog.product.created') {
    return {
      title: 'New product',
      body: `Product ${payload.productId} was created.`,
    };
  }

  if (eventName === 'catalog.product.updated') {
    return {
      title: 'Product updated',
      body: `Product ${payload.productId} was updated.`,
    };
  }

  return {
    title: 'Notification',
    body: `Event ${eventName} received.`,
  };
}

module.exports = {
  canonicalizeEventName,
  buildNotificationContent,
};
