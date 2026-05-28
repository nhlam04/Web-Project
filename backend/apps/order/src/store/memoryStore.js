const { randomUUID } = require("crypto");
const { getPool, withTransaction } = require("../db/postgres");
const {
  buildOrderCancelledPayload,
  buildOrderCreatedPayload,
  buildOrderStatusUpdatedPayload,
  getOrderRoutingMetadata,
} = require("../contracts/eventContract");

function nowIso() {
  return new Date().toISOString();
}

function mapCartRow(row, items) {
  return {
    id: row.id,
    userId: row.user_id,
    currency: row.currency,
    status: row.status,
    items,
    totals: row.totals,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    checkedOutAt: row.checked_out_at ? row.checked_out_at.toISOString() : null,
  };
}

function mapOrderRow(row, items) {
  return {
    id: row.id,
    userId: row.user_id,
    cartId: row.cart_id,
    status: row.status,
    shippingAddress: row.shipping_address,
    paymentMethod: row.payment_method,
    currency: row.currency,
    items,
    totals: row.totals,
    history: row.history,
    cancelledAt: row.cancelled_at ? row.cancelled_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function createCart({ userId, currency = "VND" }, client) {
  const db = client || getPool();
  const createdAt = nowIso();
  const id = randomUUID();

  await db.query(
    `
      INSERT INTO ordering.carts (id, user_id, currency, status, totals, created_at, updated_at, checked_out_at)
      VALUES ($1, $2, $3, 'ACTIVE', $4::jsonb, $5::timestamptz, $5::timestamptz, NULL)
    `,
    [id, userId, currency, JSON.stringify({ subtotal: 0, totalQuantity: 0, total: 0 }), createdAt],
  );

  return {
    id,
    userId,
    currency,
    status: "ACTIVE",
    items: [],
    totals: { subtotal: 0, totalQuantity: 0, total: 0 },
    createdAt,
    updatedAt: createdAt,
    checkedOutAt: null,
  };
}

async function getCart(cartId, client) {
  const db = client || getPool();

  const cartResult = await db.query(
    `
      SELECT id, user_id, currency, status, totals, created_at, updated_at, checked_out_at
      FROM ordering.carts
      WHERE id = $1
    `,
    [cartId],
  );

  if (!cartResult.rowCount) {
    return null;
  }

  const itemsResult = await db.query(
    `
      SELECT product_id, seller_id, name, quantity, unit_price
      FROM ordering.cart_items
      WHERE cart_id = $1
      ORDER BY name ASC
    `,
    [cartId],
  );

  const items = itemsResult.rows.map((row) => ({
    productId: row.product_id,
    sellerId: row.seller_id,
    name: row.name,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
  }));

  return mapCartRow(cartResult.rows[0], items);
}

async function replaceCartItems(cartId, items, totals, client) {
  const db = client || getPool();
  const updatedAt = nowIso();

  await db.query("DELETE FROM ordering.cart_items WHERE cart_id = $1", [cartId]);

  for (const item of items) {
    await db.query(
      `
        INSERT INTO ordering.cart_items (cart_id, product_id, seller_id, name, quantity, unit_price)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [cartId, item.productId, item.sellerId, item.name, item.quantity, item.unitPrice],
    );
  }

  await db.query(
    `
      UPDATE ordering.carts
      SET totals = $2::jsonb,
          updated_at = $3::timestamptz
      WHERE id = $1
    `,
    [cartId, JSON.stringify(totals), updatedAt],
  );

  return getCart(cartId, db);
}

async function markCartCheckedOut(cartId, checkedOutAt, client) {
  const db = client || getPool();

  await db.query(
    `
      UPDATE ordering.carts
      SET status = 'CHECKED_OUT',
          checked_out_at = $2::timestamptz,
          updated_at = $2::timestamptz
      WHERE id = $1
    `,
    [cartId, checkedOutAt],
  );

  return getCart(cartId, db);
}

async function saveOrder(order, client) {
  const db = client || getPool();

  await db.query(
    `
      INSERT INTO ordering.orders (
        id, user_id, cart_id, status, shipping_address, payment_method,
        currency, totals, history, cancelled_at, created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5::jsonb, $6,
        $7, $8::jsonb, $9::jsonb, $10::timestamptz, $11::timestamptz, $12::timestamptz
      )
    `,
    [
      order.id,
      order.userId,
      order.cartId,
      order.status,
      JSON.stringify(order.shippingAddress),
      order.paymentMethod,
      order.currency,
      JSON.stringify(order.totals),
      JSON.stringify(order.history),
      order.cancelledAt || null,
      order.createdAt,
      order.updatedAt,
    ],
  );

  for (const item of order.items) {
    await db.query(
      `
        INSERT INTO ordering.order_items (
          order_id, product_id, seller_id, name, quantity, unit_price, line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        order.id,
        item.productId,
        item.sellerId,
        item.name,
        item.quantity,
        item.unitPrice,
        item.lineTotal,
      ],
    );
  }

  return order;
}

async function getOrder(orderId, client) {
  const db = client || getPool();

  const orderResult = await db.query(
    `
      SELECT
        id, user_id, cart_id, status, shipping_address, payment_method,
        currency, totals, history, cancelled_at, created_at, updated_at
      FROM ordering.orders
      WHERE id = $1
    `,
    [orderId],
  );

  if (!orderResult.rowCount) {
    return null;
  }

  const itemsResult = await db.query(
    `
      SELECT product_id, seller_id, name, quantity, unit_price, line_total
      FROM ordering.order_items
      WHERE order_id = $1
      ORDER BY name ASC
    `,
    [orderId],
  );

  const items = itemsResult.rows.map((row) => ({
    productId: row.product_id,
    sellerId: row.seller_id,
    name: row.name,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    lineTotal: Number(row.line_total),
  }));

  return mapOrderRow(orderResult.rows[0], items);
}

async function updateOrder(orderId, updater, client) {
  const db = client || getPool();
  const current = await getOrder(orderId, db);
  if (!current) {
    return null;
  }

  const updated = {
    ...updater(current),
    updatedAt: nowIso(),
  };

  await db.query(
    `
      UPDATE ordering.orders
      SET status = $2,
          totals = $3::jsonb,
          history = $4::jsonb,
          cancelled_at = $5::timestamptz,
          updated_at = $6::timestamptz
      WHERE id = $1
    `,
    [
      orderId,
      updated.status,
      JSON.stringify(updated.totals),
      JSON.stringify(updated.history),
      updated.cancelledAt || null,
      updated.updatedAt,
    ],
  );

  return getOrder(orderId, db);
}

async function listOrdersByUser(userId, client) {
  const db = client || getPool();
  const result = await db.query(
    `
      SELECT id
      FROM ordering.orders
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId],
  );

  const orders = [];
  for (const row of result.rows) {
    const order = await getOrder(row.id, db);
    if (order) {
      orders.push(order);
    }
  }
  return orders;
}

async function pushOutboxEvent(event, client) {
  const db = client || getPool();
  const routing = getOrderRoutingMetadata(event.eventType);
  const outbox = {
    id: randomUUID(),
    aggregateType: "ORDER",
    aggregateId: event.aggregateId,
    eventType: event.eventType,
    exchangeName: event.exchangeName || routing.exchangeName,
    routingKey: event.routingKey || routing.routingKey,
    payload: event.payload,
    status: "PENDING",
    createdAt: nowIso(),
    publishedAt: null,
  };

  await db.query(
    `
      INSERT INTO ordering.outbox_events (
        id, aggregate_type, aggregate_id, event_type, exchange_name, routing_key,
        payload, status, created_at, published_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::timestamptz, NULL)
    `,
    [
      outbox.id,
      outbox.aggregateType,
      outbox.aggregateId,
      outbox.eventType,
      outbox.exchangeName,
      outbox.routingKey,
      JSON.stringify(outbox.payload),
      outbox.status,
      outbox.createdAt,
    ],
  );

  return outbox;
}

async function listOutboxPending(client) {
  const db = client || getPool();
  const result = await db.query(
    `
      SELECT
        id, aggregate_type, aggregate_id, event_type, exchange_name, routing_key,
        payload, status, created_at, published_at
      FROM ordering.outbox_events
      WHERE status = 'PENDING'
      ORDER BY created_at ASC
    `,
  );

  return result.rows.map((row) => ({
    id: row.id,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    eventType: row.event_type,
    exchangeName: row.exchange_name,
    routingKey: row.routing_key,
    payload: row.payload,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
  }));
}

async function markOutboxPublished(outboxId, client) {
  const db = client || getPool();
  const publishedAt = nowIso();
  const result = await db.query(
    `
      UPDATE ordering.outbox_events
      SET status = 'PUBLISHED',
          published_at = $2::timestamptz
      WHERE id = $1
      RETURNING
        id, aggregate_type, aggregate_id, event_type, exchange_name, routing_key,
        payload, status, created_at, published_at
    `,
    [outboxId, publishedAt],
  );

  if (!result.rowCount) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    eventType: row.event_type,
    exchangeName: row.exchange_name,
    routingKey: row.routing_key,
    payload: row.payload,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
  };
}

async function isDuplicateEvent(consumerName, eventId, client) {
  const db = client || getPool();
  const result = await db.query(
    `
      SELECT 1
      FROM ordering.inbox_events
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
      INSERT INTO ordering.inbox_events (consumer_name, event_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `,
    [consumerName, eventId],
  );
}

module.exports = {
  withTransaction,
  createCart,
  getCart,
  replaceCartItems,
  markCartCheckedOut,
  saveOrder,
  getOrder,
  updateOrder,
  listOrdersByUser,
  pushOutboxEvent,
  listOutboxPending,
  markOutboxPublished,
  isDuplicateEvent,
  markEventProcessed,
};
