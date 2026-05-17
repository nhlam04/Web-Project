const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool(config.db);

function getPool() {
  return pool;
}

async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function initDatabase() {
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS notification;

    CREATE TABLE IF NOT EXISTS notification.notifications (
      id UUID PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_name TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL,
      payload JSONB NOT NULL,
      delivery_attempts INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at TIMESTAMPTZ NULL,
      read_at TIMESTAMPTZ NULL
    );

    CREATE TABLE IF NOT EXISTS notification.notification_preferences (
      user_id TEXT PRIMARY KEY,
      channels JSONB NOT NULL DEFAULT '{"inApp": true, "email": false, "sms": false, "push": false}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notification.inbox_events (
      consumer_name TEXT NOT NULL,
      event_id TEXT NOT NULL,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (consumer_name, event_id)
    );

    CREATE TABLE IF NOT EXISTS notification.outbox_events (
      id UUID PRIMARY KEY,
      aggregate_type TEXT NOT NULL,
      aggregate_id UUID NOT NULL,
      event_type TEXT NOT NULL,
      exchange_name TEXT NULL,
      routing_key TEXT NULL,
      payload JSONB NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      published_at TIMESTAMPTZ NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notification_user_created ON notification.notifications(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notification_status_created ON notification.notifications(status, created_at DESC);
  `);
}

module.exports = {
  getPool,
  withTransaction,
  initDatabase,
};
