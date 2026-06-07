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
  ReviewCreated: 'review.created',
};

function canonicalizeEventName(eventName) {
  return EVENT_ALIASES[eventName] || eventName || 'unknown';
}

function buildNotificationContent(eventName, payload) {
  if (eventName === 'order.placed') {
    return {
      title: 'Đã đặt hàng',
      body: `Đơn hàng ${payload.orderId} đã được tạo thành công.`,
    };
  }

  if (eventName === 'order.cancelled') {
    return {
      title: 'Đã hủy đơn hàng',
      body: `Đơn hàng ${payload.orderId} đã bị hủy.`,
    };
  }

  if (eventName === 'order.status_updated') {
    return {
      title: 'Cập nhật trạng thái đơn hàng',
      body: `Trạng thái đơn hàng ${payload.orderId} đã chuyển sang ${payload.toStatus}.`,
    };
  }

  if (eventName === 'fulfillment.seller_order_confirmed') {
    return {
      title: 'Người bán đã xác nhận',
      body: `Người bán đã xác nhận đơn hàng ${payload.orderId}.`,
    };
  }

  if (eventName === 'fulfillment.delivery_updated') {
    return {
      title: 'Cập nhật giao hàng',
      body: `Trạng thái giao hàng đơn ${payload.orderId} là ${payload.newStatus || payload.status}.`,
    };
  }

  if (eventName === 'fulfillment.order_completed') {
    return {
      title: 'Đơn hàng hoàn tất',
      body: `Đơn hàng ${payload.orderId} đã được hoàn tất.`,
    };
  }

  if (eventName === 'review.created') {
    return {
      title: 'Đánh giá mới',
      body: `Đánh giá ${payload.reviewId} đã được gửi.`,
    };
  }

  if (eventName === 'chat.message.sent') {
    return {
      title: 'Tin nhắn mới',
      body: 'Bạn có một tin nhắn mới.',
    };
  }

  if (eventName === 'catalog.product.created') {
    return {
      title: 'Sản phẩm mới',
      body: `Sản phẩm ${payload.productId} đã được tạo.`,
    };
  }

  if (eventName === 'catalog.product.updated') {
    return {
      title: 'Cập nhật sản phẩm',
      body: `Sản phẩm ${payload.productId} đã được cập nhật.`,
    };
  }

  return {
    title: 'Thông báo',
    body: `Đã nhận được sự kiện ${eventName}.`,
  };
}

module.exports = {
  canonicalizeEventName,
  buildNotificationContent,
};
