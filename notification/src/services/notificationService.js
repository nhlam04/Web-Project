const store = require('../store/notificationStore');

const CHANNEL_IN_APP = 'IN_APP';

function normalizeEventName(event) {
  return event.eventName || event.eventType || event.type || 'unknown';
}

function resolveUserId(payload) {
  return (
    payload.customerId ||
    payload.userId ||
    payload.recipientId ||
    payload.sellerId ||
    null
  );
}

function buildTitleBody(eventName, payload) {
  if (eventName === 'order.created') {
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

  if (eventName === 'order.status.updated') {
    return {
      title: 'Order status updated',
      body: `Order ${payload.orderId} moved to ${payload.toStatus}.`,
    };
  }

  if (eventName === 'fulfillment.seller-order-confirmed') {
    return {
      title: 'Seller confirmed order',
      body: `Seller confirmed order ${payload.orderId}.`,
    };
  }

  if (eventName === 'fulfillment.status-updated') {
    return {
      title: 'Delivery update',
      body: `Order ${payload.orderId} status is ${payload.newStatus}.`,
    };
  }

  if (eventName === 'fulfillment.completed') {
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

async function shouldSendInApp(userId) {
  const preferences = await store.getPreferences(userId);
  return preferences.channels?.inApp !== false;
}

async function handleEvent(event, consumerName) {
  if (!event || typeof event !== 'object') {
    return null;
  }

  const eventName = normalizeEventName(event);
  const payload = event.payload || event.data || {};
  const userId = resolveUserId(payload);

  if (!userId) {
    return null;
  }

  if (event.eventId && consumerName) {
    const duplicate = await store.isDuplicateEvent(consumerName, event.eventId);
    if (duplicate) {
      return null;
    }
  }

  const inAppEnabled = await shouldSendInApp(userId);
  if (!inAppEnabled) {
    if (event.eventId && consumerName) {
      await store.markEventProcessed(consumerName, event.eventId);
    }
    return null;
  }

  const content = buildTitleBody(eventName, payload);
  const notification = await store.createNotification({
    userId,
    eventName,
    title: content.title,
    body: content.body,
    channel: CHANNEL_IN_APP,
    status: 'SENT',
    payload,
    deliveryAttempts: 1,
    sentAt: new Date().toISOString(),
  });

  if (event.eventId && consumerName) {
    await store.markEventProcessed(consumerName, event.eventId);
  }

  return notification;
}

module.exports = {
  handleEvent,
};
