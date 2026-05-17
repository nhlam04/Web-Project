# Ordering Service

Node.js service for cart and order management in a microservice e-commerce system.

## Responsibilities

- Manage cart lifecycle for customers.
- Create orders from carts.
- Handle strict order state transition flow.
- Support order cancellation with transition rules.
- Publish order domain events through outbox.
- Consume fulfillment events to update order status.
- Persist carts, orders, and outbox data in PostgreSQL (`ordering` schema).

## Quick start

1. Start PostgreSQL (from `order/`):

  docker compose up -d

2. Install dependencies:

   npm install

3. Start service:

   npm run start

4. Health check:

   GET http://localhost:8083/health

5. Run smoke test (requires PostgreSQL running):

  npm run smoke

The smoke test waits for DB readiness, validates checkout + fulfillment confirmation,
and validates cancellation/outbox behavior.

## Configuration

Environment variables:

- `PORT` (default: `8083`)
- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `5432`)
- `DB_USER` (default: `admin`)
- `DB_PASS` (default: `password123`)
- `DB_NAME` (default: `microservices_db`)
- `DB_POOL_MAX` (default: `10`)
- `RABBITMQ_URL` (default: `amqp://admin:admin123@localhost:5672`)
- `RABBITMQ_EXCHANGE` (default: `ecommerce.events`)
- `RABBITMQ_EXCHANGE_TYPE` (default: `topic`)
- `OUTBOX_PUBLISHER_ENABLED` (default: `true`)
- `OUTBOX_PUBLISHER_POLL_MS` (default: `3000`)
- `OUTBOX_PUBLISHER_BATCH_SIZE` (default: `50`)
- `FULFILLMENT_CONSUMER_ENABLED` (default: `true`)
- `FULFILLMENT_CONSUMER_QUEUE` (default: `ordering.fulfillment-events`)
- `FULFILLMENT_CONSUMER_ROUTING_KEYS` (default: `fulfillment.seller-order-confirmed,fulfillment.status-updated,fulfillment.completed`)
- `FULFILLMENT_CONSUMER_PREFETCH` (default: `20`)
- `FULFILLMENT_CONSUMER_RECONNECT_MS` (default: `5000`)

Copy `.env.example` to `.env` and adjust values if needed.

On startup, the service initializes these tables (if missing):

- `ordering.carts`
- `ordering.cart_items`
- `ordering.orders`
- `ordering.order_items`
- `ordering.outbox_events`

Outbox routing keys:

- `order.created` -> `order.created`
- `order.cancelled` -> `order.cancelled`
- `order.status.updated` -> `order.status.updated`

Inbound fulfillment routing keys consumed:

- `fulfillment.seller-order-confirmed`
- `fulfillment.status-updated`
- `fulfillment.completed`

## Order state machine

- PLACED -> SELLER_CONFIRMED -> IN_DELIVERY -> DELIVERED -> COMPLETED
- Cancellation is allowed only from:
  - PLACED
  - SELLER_CONFIRMED

Any invalid transition returns HTTP 409.

## Main endpoints

- Public API:
  - POST /api/v1/carts
  - GET /api/v1/carts/:cartId
  - POST /api/v1/carts/:cartId/items
  - PATCH /api/v1/carts/:cartId/items/:productId
  - POST /api/v1/orders
  - GET /api/v1/orders/:orderId
  - GET /api/v1/orders?userId=...
  - POST /api/v1/orders/:orderId/cancel

- Internal integration API:
  - POST /api/v1/internal/events/fulfillment
  - GET /api/v1/internal/outbox/pending
  - POST /api/v1/internal/outbox/mark-published

See full integration contract in docs/ordering-service-apis.md.
