# Ordering Service

Node.js service for cart and order management in a microservice e-commerce system.

## Responsibilities

- Manage cart lifecycle for customers.
- Create orders from carts.
- Handle strict order state transition flow.
- Support order cancellation with transition rules.
- Publish order domain events through outbox.
- Consume fulfillment events to update order status.

## Quick start

1. Install dependencies:

   npm install

2. Start service:

   npm run start

3. Health check:

   GET http://localhost:8083/health

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
