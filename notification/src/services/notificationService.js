const store = require('../store/notificationStore');
const { withTransaction } = require('../db/postgres');
const { canonicalizeEventName, buildNotificationContent } = require('../contracts/eventContract');

const CHANNEL_IN_APP = 'IN_APP';
const CONSUMER_NAME = 'notification.EventConsumer';

function normalizeEventName(event) {
  return canonicalizeEventName(event.eventName || event.eventType || event.type);
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

async function shouldSendInApp(userId) {
  const preferences = await store.getPreferences(userId);
  return preferences.channels?.inApp !== false;
}

async function handleEvent(event, consumerName = CONSUMER_NAME) {
  if (!event || typeof event !== 'object') {
    return null;
  }

  const eventName = normalizeEventName(event);
  const payload = event.payload || event.data || {};
  const userId = resolveUserId(payload);

  if (!userId) {
    return null;
  }

  return withTransaction(async (client) => {
    if (event.eventId && consumerName) {
      const duplicate = await store.isDuplicateEvent(consumerName, event.eventId, client);
      if (duplicate) {
        return null;
      }
    }

    const inAppEnabled = await shouldSendInApp(userId);
    if (!inAppEnabled) {
      if (event.eventId && consumerName) {
        await store.markEventProcessed(consumerName, event.eventId, client);
      }
      return null;
    }

    const content = buildNotificationContent(eventName, payload);
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
    }, client);

    if (event.eventId && consumerName) {
      await store.markEventProcessed(consumerName, event.eventId, client);
    }

    return notification;
  });
}

module.exports = {
  handleEvent,
};
