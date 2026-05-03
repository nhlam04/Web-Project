const { randomUUID } = require('crypto');
const { getPool } = require('../db/postgres');

function nowIso() {
  return new Date().toISOString();
}

async function createNotification(input, client) {
  const db = client || getPool();
  const id = randomUUID();
  const createdAt = nowIso();
  const sentAt = input.sentAt || null;

  await db.query(
    `
      INSERT INTO notification.notifications (
        id, user_id, event_name, title, body, channel, status,
        payload, delivery_attempts, created_at, sent_at, read_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::timestamptz, $11::timestamptz, $12::timestamptz)
    `,
    [
      id,
      input.userId,
      input.eventName,
      input.title,
      input.body,
      input.channel,
      input.status,
      JSON.stringify(input.payload || {}),
      input.deliveryAttempts || 0,
      createdAt,
      sentAt,
      input.readAt || null,
    ],
  );

  return {
    id,
    userId: input.userId,
    eventName: input.eventName,
    title: input.title,
    body: input.body,
    channel: input.channel,
    status: input.status,
    payload: input.payload || {},
    deliveryAttempts: input.deliveryAttempts || 0,
    createdAt,
    sentAt,
    readAt: input.readAt || null,
  };
}

async function listNotificationsByUser(userId, options = {}, client) {
  const db = client || getPool();
  const params = [userId];
  const conditions = ['user_id = $1'];

  if (options.unreadOnly) {
    conditions.push('read_at IS NULL');
  }

  const query = `
    SELECT id, user_id, event_name, title, body, channel, status, payload,
           delivery_attempts, created_at, sent_at, read_at
    FROM notification.notifications
    WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT 100
  `;

  const result = await db.query(query, params);
  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    eventName: row.event_name,
    title: row.title,
    body: row.body,
    channel: row.channel,
    status: row.status,
    payload: row.payload,
    deliveryAttempts: Number(row.delivery_attempts),
    createdAt: row.created_at.toISOString(),
    sentAt: row.sent_at ? row.sent_at.toISOString() : null,
    readAt: row.read_at ? row.read_at.toISOString() : null,
  }));
}

async function markNotificationRead(notificationId, client) {
  const db = client || getPool();
  const readAt = nowIso();

  const result = await db.query(
    `
      UPDATE notification.notifications
      SET read_at = $2::timestamptz
      WHERE id = $1
      RETURNING id, user_id, event_name, title, body, channel, status, payload,
                delivery_attempts, created_at, sent_at, read_at
    `,
    [notificationId, readAt],
  );

  if (!result.rowCount) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    eventName: row.event_name,
    title: row.title,
    body: row.body,
    channel: row.channel,
    status: row.status,
    payload: row.payload,
    deliveryAttempts: Number(row.delivery_attempts),
    createdAt: row.created_at.toISOString(),
    sentAt: row.sent_at ? row.sent_at.toISOString() : null,
    readAt: row.read_at ? row.read_at.toISOString() : null,
  };
}

async function getPreferences(userId, client) {
  const db = client || getPool();
  const result = await db.query(
    `
      SELECT user_id, channels, updated_at
      FROM notification.notification_preferences
      WHERE user_id = $1
    `,
    [userId],
  );

  if (!result.rowCount) {
    return {
      userId,
      channels: { inApp: true, email: false, sms: false, push: false },
      updatedAt: null,
    };
  }

  const row = result.rows[0];
  return {
    userId: row.user_id,
    channels: row.channels,
    updatedAt: row.updated_at.toISOString(),
  };
}

async function upsertPreferences(userId, channels, client) {
  const db = client || getPool();
  const updatedAt = nowIso();

  await db.query(
    `
      INSERT INTO notification.notification_preferences (user_id, channels, updated_at)
      VALUES ($1, $2::jsonb, $3::timestamptz)
      ON CONFLICT (user_id)
      DO UPDATE SET channels = EXCLUDED.channels, updated_at = EXCLUDED.updated_at
    `,
    [userId, JSON.stringify(channels), updatedAt],
  );

  return {
    userId,
    channels,
    updatedAt,
  };
}

async function isDuplicateEvent(consumerName, eventId, client) {
  const db = client || getPool();
  const result = await db.query(
    `
      SELECT 1
      FROM notification.inbox_events
      WHERE consumer_name = $1 AND event_id = $2
    `,
    [consumerName, eventId],
  );
  return result.rowCount > 0;
}

async function markEventProcessed(consumerName, eventId, client) {
  const db = client || getPool();
  await db.query(
    `
      INSERT INTO notification.inbox_events (consumer_name, event_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `,
    [consumerName, eventId],
  );
}

module.exports = {
  createNotification,
  listNotificationsByUser,
  markNotificationRead,
  getPreferences,
  upsertPreferences,
  isDuplicateEvent,
  markEventProcessed,
};
