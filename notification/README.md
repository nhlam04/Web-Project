# Notification Service

Node.js service for in-app notifications in the e-commerce microservice architecture.

## Responsibilities

- Consume domain events from RabbitMQ.
- Persist notifications for end users.
- Provide notification and preference APIs.

## Quick start

1. Start PostgreSQL (from `notification/`):

  docker compose up -d

2. Install dependencies:

   npm install

3. Start service:

   npm run start

4. Health check:

   GET http://localhost:8086/health

5. Run smoke test (requires PostgreSQL running):

  npm run smoke

## Configuration

Environment variables:

- `PORT` (default: `8086`)
- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `5432`)
- `DB_USER` (default: `admin`)
- `DB_PASS` (default: `password123`)
- `DB_NAME` (default: `microservices_db`)
- `DB_POOL_MAX` (default: `10`)
- `RABBITMQ_URL` (default: `amqp://admin:admin123@localhost:5672`)
- `RABBITMQ_EXCHANGE` (default: `ecommerce.events`)
- `RABBITMQ_EXCHANGE_TYPE` (default: `topic`)
- `NOTIFICATION_CONSUMER_ENABLED` (default: `true`)
- `NOTIFICATION_CONSUMER_QUEUE` (default: `notification.events`)
- `NOTIFICATION_CONSUMER_ROUTING_KEYS` (default: `order.*,fulfillment.*,review.*,chat.*,catalog.*`)
- `NOTIFICATION_CONSUMER_PREFETCH` (default: `20`)
- `NOTIFICATION_CONSUMER_RECONNECT_MS` (default: `5000`)

Copy `.env.example` to `.env` and adjust values if needed.

## Tables

On startup, the service initializes these tables (if missing):

- `notification.notifications`
- `notification.notification_preferences`
- `notification.inbox_events`
- `notification.outbox_events`

## Endpoints

- Public API:
  - GET /api/v1/notifications?userId=...
  - PATCH /api/v1/notifications/:notificationId/read
  - GET /api/v1/preferences?userId=...
  - PUT /api/v1/preferences/:userId

- Internal integration API:
  - POST /api/v1/internal/events

## Event names supported

- `order.created`
- `order.cancelled`
- `order.status.updated`
- `OrderPlaced` (alias for `order.created`)
- `OrderCancelled` (alias for `order.cancelled`)
- `OrderStatusUpdated` (alias for `order.status.updated`)
- `fulfillment.seller-order-confirmed`
- `fulfillment.status-updated`
- `fulfillment.completed`
- `SellerOrderConfirmed` (alias for `fulfillment.seller-order-confirmed`)
- `DeliveryUpdated` (alias for `fulfillment.status-updated`)
- `OrderCompleted` (alias for `fulfillment.completed`)
- `review.created`
- `chat.message.sent`
- `catalog.product.created`
- `catalog.product.updated`

The ordering service currently publishes `eventType` values like `OrderPlaced`, `OrderCancelled`, and `OrderStatusUpdated`; the notification service now canonicalizes those into the notification templates above.
