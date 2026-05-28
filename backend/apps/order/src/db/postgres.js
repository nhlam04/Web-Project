const { Pool } = require("pg");
const config = require("../config");

const pool = new Pool(config.db);

function getPool() {
  return pool;
}

async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function initDatabase() {
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS ordering;

    CREATE TABLE IF NOT EXISTS ordering.carts (
      id UUID PRIMARY KEY,
      user_id TEXT NOT NULL,
      currency CHAR(3) NOT NULL,
      status TEXT NOT NULL,
      totals JSONB NOT NULL DEFAULT '{"subtotal":0,"totalQuantity":0,"total":0}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checked_out_at TIMESTAMPTZ NULL
    );

    CREATE TABLE IF NOT EXISTS ordering.cart_items (
      cart_id UUID NOT NULL REFERENCES ordering.carts(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(14,2) NOT NULL,
      PRIMARY KEY (cart_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS ordering.orders (
      id UUID PRIMARY KEY,
      user_id TEXT NOT NULL,
      cart_id UUID NOT NULL,
      status TEXT NOT NULL,
      shipping_address JSONB NOT NULL,
      payment_method TEXT NOT NULL,
      currency CHAR(3) NOT NULL,
      totals JSONB NOT NULL,
      history JSONB NOT NULL,
      cancelled_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ordering.order_items (
      order_id UUID NOT NULL REFERENCES ordering.orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(14,2) NOT NULL,
      line_total NUMERIC(14,2) NOT NULL,
      PRIMARY KEY (order_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS ordering.outbox_events (
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

    CREATE TABLE IF NOT EXISTS ordering.inbox_events (
      consumer_name TEXT NOT NULL,
      event_id TEXT NOT NULL,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (consumer_name, event_id)
    );

    ALTER TABLE ordering.outbox_events
      ADD COLUMN IF NOT EXISTS exchange_name TEXT NULL;

    ALTER TABLE ordering.outbox_events
      ADD COLUMN IF NOT EXISTS routing_key TEXT NULL;

    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON ordering.orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_outbox_status_created ON ordering.outbox_events(status, created_at);
  `);
}

module.exports = {
  getPool,
  withTransaction,
  initDatabase,
};
