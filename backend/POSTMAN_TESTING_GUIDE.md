# Backend Run And Postman Testing Guide

This guide covers the current Fulfillment and Review services.

## 1. Start Infrastructure

From `backend`:

```powershell
docker compose -f infra/docker-compose.yml up -d
```

RabbitMQ Management UI:

```text
http://localhost:15672
user: admin
password: admin123
```

MySQL:

```text
host: localhost
port: 3306
user: root
password: root
```

## 2. Run Migrations

From `backend`:

```powershell
npm run migration:run:fulfillment
npm run migration:run:review
```

## 3. Start Services

Use separate terminals from `backend`:

```powershell
npm run dev:fulfillment
npm run dev:review
npm run dev:gateway
```

Default URLs:

```text
Fulfillment: http://localhost:3002
Review:      http://localhost:3003
Gateway:     http://localhost:3000
```

## 4. Postman Environment

Create a Postman environment with:

```text
fulfillmentUrl = http://localhost:3002
reviewUrl = http://localhost:3003
gatewayUrl = http://localhost:3000
sellerId = seller-1
customerId = user-1
orderId = order-1
productId = product-1
```

For local testing, pass seller context with:

```http
x-seller-id: {{sellerId}}
```

## 5. Fulfillment API Tests

### Create a fulfillment directly

```http
POST {{fulfillmentUrl}}/fulfillments
Content-Type: application/json
```

```json
{
  "orderId": "{{orderId}}",
  "customerId": "{{customerId}}",
  "sellerId": "{{sellerId}}",
  "items": [
    {
      "productId": "{{productId}}",
      "name": "Product A",
      "quantity": 2,
      "unitPrice": 100000,
      "lineTotal": 200000
    }
  ]
}
```

Save the returned `id` as `fulfillmentId`.

### List seller orders

```http
GET {{fulfillmentUrl}}/seller/orders?sellerId={{sellerId}}
```

### Confirm

```http
PATCH {{fulfillmentUrl}}/seller/orders/{{fulfillmentId}}/confirm
x-seller-id: {{sellerId}}
```

### Ship

```http
PATCH {{fulfillmentUrl}}/seller/orders/{{fulfillmentId}}/ship
x-seller-id: {{sellerId}}
Content-Type: application/json
```

```json
{
  "carrier": "GHN",
  "trackingCode": "GHN123"
}
```

### Deliver

```http
PATCH {{fulfillmentUrl}}/seller/orders/{{fulfillmentId}}/deliver
x-seller-id: {{sellerId}}
```

### Complete

```http
PATCH {{fulfillmentUrl}}/seller/orders/{{fulfillmentId}}/complete
x-seller-id: {{sellerId}}
```

Expected result:

- `fulfillments.status = COMPLETED`
- `outbox` contains `SellerOrderConfirmed`, `DeliveryUpdated`, and `OrderCompleted` events.
- Outbox poller publishes them to `cnweb.events`.

## 6. Review API Tests

After the fulfillment is completed and Review consumes `OrderCompleted`, check eligibility:

```http
GET {{reviewUrl}}/reviews/eligibility?customerId={{customerId}}&orderId={{orderId}}&productId={{productId}}
```

Create a review:

```http
POST {{reviewUrl}}/reviews
Content-Type: application/json
```

```json
{
  "productId": "{{productId}}",
  "customerId": "{{customerId}}",
  "orderId": "{{orderId}}",
  "fulfillmentId": "{{fulfillmentId}}",
  "rating": 5,
  "comment": "Good product"
}
```

List product reviews:

```http
GET {{reviewUrl}}/reviews/products/{{productId}}
```

Expected result:

- `reviews` contains the new review.
- Matching `review_eligibilities.isEligible` becomes `false`.
- `outbox` contains a `ReviewCreated` event with routing key `review.created`.

## 7. RabbitMQ Event Test Without Ordering

If Ordering is not running yet, publish an `OrderPlaced` message manually in RabbitMQ Management.

Exchange:

```text
cnweb.events
```

Routing key:

```text
order.placed
```

Payload:

```json
{
  "eventId": "evt-order-placed-1",
  "eventType": "OrderPlaced",
  "aggregateType": "Order",
  "aggregateId": "order-1",
  "occurredAt": "2026-05-17T00:00:00.000Z",
  "producer": "ordering-service",
  "version": 1,
  "correlationId": "corr-1",
  "payload": {
    "orderId": "order-1",
    "customerId": "user-1",
    "shippingAddress": {
      "fullName": "Nguyen Van A",
      "phone": "0900000000",
      "address": "HCM"
    },
    "paymentMethod": "COD",
    "currency": "VND",
    "totals": {
      "subtotal": 200000,
      "totalQuantity": 2,
      "total": 200000
    },
    "items": [
      {
        "productId": "product-1",
        "sellerId": "seller-1",
        "name": "Product A",
        "quantity": 2,
        "unitPrice": 100000,
        "lineTotal": 200000
      }
    ]
  }
}
```

Expected result:

- Fulfillment creates one `PENDING` seller order.
- Re-publishing the same `eventId` does not create a duplicate.

