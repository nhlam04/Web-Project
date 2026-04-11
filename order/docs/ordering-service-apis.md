# Ordering Service Integration APIs

This document describes:
- APIs provided by Ordering Service to other services.
- APIs from other services that Ordering Service needs.
- Event contracts used for service-to-service communication.

## 1) APIs provided by Ordering Service

Base URL (example):
- http://ordering-service:8083

### 1.1 Public/Frontend-facing APIs

#### Create cart
- Method: POST
- Path: /api/v1/carts
- Body:
{
  "userId": "u_123",
  "currency": "VND"
}
- Response: 201 with cart object.

#### Get cart
- Method: GET
- Path: /api/v1/carts/:cartId
- Response: 200 with cart.

#### Add item to cart
- Method: POST
- Path: /api/v1/carts/:cartId/items
- Body:
{
  "productId": "p_100",
  "sellerId": "s_456",
  "name": "Ao hoodie",
  "quantity": 2,
  "unitPrice": 250000
}
- Response: 200 with updated cart.

#### Update cart item quantity (0 means remove)
- Method: PATCH
- Path: /api/v1/carts/:cartId/items/:productId
- Body:
{
  "quantity": 1
}
- Response: 200 with updated cart.

#### Checkout cart to create order
- Method: POST
- Path: /api/v1/orders
- Body:
{
  "cartId": "cart_uuid",
  "userId": "u_123",
  "shippingAddress": {
    "recipientName": "Nguyen Van A",
    "phone": "0900000000",
    "line1": "123 Duong ABC",
    "ward": "Phuong 1",
    "district": "Quan 1",
    "city": "HCM",
    "country": "VN"
  },
  "paymentMethod": "COD"
}
- Response: 201 with created order.
- Side effect: outbox emits OrderPlaced.

#### Get order detail
- Method: GET
- Path: /api/v1/orders/:orderId
- Response: 200 with order.

#### List orders by user
- Method: GET
- Path: /api/v1/orders?userId=u_123
- Response: 200 with list of orders.

#### Cancel order
- Method: POST
- Path: /api/v1/orders/:orderId/cancel
- Body:
{
  "reason": "Customer requested cancellation"
}
- Response: 200 with cancelled order.
- Side effect: outbox emits OrderCancelled.

### 1.2 Internal APIs (for service-to-service)

#### Consume fulfillment events
- Method: POST
- Path: /api/v1/internal/events/fulfillment
- Purpose: Fulfillment Service (or event-relay worker) sends fulfillment domain events to update order status.
- Body:
{
  "eventType": "SellerOrderConfirmed",
  "data": {
    "orderId": "order_uuid"
  }
}

Supported eventType values:
- SellerOrderConfirmed => transition to SELLER_CONFIRMED
- DeliveryUpdated with deliveryStatus=IN_TRANSIT => transition to IN_DELIVERY
- DeliveryUpdated with deliveryStatus=DELIVERED => transition to DELIVERED
- OrderCompleted => transition to COMPLETED

#### Get pending outbox events
- Method: GET
- Path: /api/v1/internal/outbox/pending
- Purpose: Event relay worker reads pending events.

#### Mark outbox event as published
- Method: POST
- Path: /api/v1/internal/outbox/mark-published
- Body:
{
  "outboxId": "outbox_uuid"
}
- Purpose: Event relay marks event sent to RabbitMQ.

## 2) Events emitted by Ordering Service (via outbox)

### OrderPlaced
Payload:
{
  "orderId": "order_uuid",
  "userId": "u_123",
  "items": [
    {
      "productId": "p_100",
      "sellerId": "s_456",
      "name": "Ao hoodie",
      "quantity": 2,
      "unitPrice": 250000,
      "lineTotal": 500000
    }
  ],
  "totals": {
    "subtotal": 500000,
    "totalQuantity": 2
  },
  "shippingAddress": { "...": "..." },
  "paymentMethod": "COD",
  "createdAt": "2026-04-11T00:00:00.000Z"
}

Typical consumers:
- Fulfillment Service (create seller orders and delivery tracking)
- Notification Service (send order placed notification)

### OrderCancelled
Payload:
{
  "orderId": "order_uuid",
  "userId": "u_123",
  "reason": "Customer requested cancellation",
  "cancelledAt": "2026-04-11T00:00:00.000Z"
}

Typical consumers:
- Fulfillment Service (stop shipment process)
- Notification Service (send cancellation notification)
- Payment Service (trigger refund if needed)

### OrderStatusUpdated
Payload:
{
  "orderId": "order_uuid",
  "fromStatus": "IN_DELIVERY",
  "toStatus": "DELIVERED",
  "changedAt": "2026-04-11T00:00:00.000Z",
  "sourceEventType": "DeliveryUpdated"
}

Typical consumers:
- Notification Service
- Customer timeline/read-model service

## 3) APIs from other services that Ordering Service needs

The current implementation contains only internal placeholders and event contracts for these dependencies. In production, Ordering should integrate with the following.

### 3.1 Account Service (required)
Used to validate user/account identity and role at checkout/cancel actions.

Needed APIs:
- Validate access token / session.
- Get account profile by userId.
- Check if account is active or blocked.

### 3.2 Catalog Service (required)
Used before checkout to validate product and seller context.

Needed APIs:
- Get product by productId.
- Validate product is active and purchasable.
- Get current product price and sellerId ownership.

### 3.3 Inventory Service (strongly recommended, currently missing in architecture)
Used to reserve/release stock during checkout/cancellation.

Needed APIs:
- Reserve stock for order draft.
- Confirm stock after order created.
- Release stock on cancellation or timeout.

### 3.4 Fulfillment Service (required)
Used indirectly by consuming domain events from fulfillment.

Needed event inputs into Ordering:
- SellerOrderConfirmed
- DeliveryUpdated
- OrderCompleted

Integration mode:
- Prefer RabbitMQ consumer in Ordering.
- Temporary mode in this implementation: internal endpoint /api/v1/internal/events/fulfillment.

### 3.5 Payment Service (strongly recommended)
Used to authorize/capture payment and refund cancellation.

Needed APIs:
- Authorize payment at checkout.
- Capture payment on seller confirmation or shipment policy.
- Refund for cancelled paid orders.

### 3.6 Notification Service (optional direct API, usually event-driven)
Ordering usually does not call notification directly.
Preferred integration:
- Notification consumes OrderPlaced, OrderCancelled, OrderStatusUpdated from broker.

## 4) Error contract

Error response format:
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Readable message"
  }
}

Typical codes:
- CART_NOT_FOUND
- ORDER_NOT_FOUND
- INVALID_CART_STATUS
- EMPTY_CART
- INVALID_ORDER_TRANSITION
- UNSUPPORTED_EVENT_TYPE
- OUTBOX_NOT_FOUND

## 5) Notes for production hardening

- Replace in-memory store by PostgreSQL ordering schema.
- Use transactional outbox table.
- Add idempotency key support for create/cancel endpoints.
- Add consumer idempotency for fulfillment events.
- Add auth middleware and service-to-service authentication.
- Add OpenTelemetry tracing and metrics.
