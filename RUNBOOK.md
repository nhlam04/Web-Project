# Local Running Book

## Start everything

```powershell
docker compose up --build
```

Open:

- Frontend via gateway: `http://localhost:8080`
- Frontend container directly: `http://localhost:3000`
- RabbitMQ management: `http://localhost:15672` (`admin` / `admin123`)

## Main local service URLs

- IAM: `http://localhost:3001`
- Catalog: `http://localhost:8000`
- Ordering: `http://localhost:8083`
- Fulfillment: `http://localhost:3002`
- Notification: `http://localhost:8086`
- API Gateway: `http://localhost:8080`

Gateway API prefixes:

- `POST http://localhost:8080/api/auth/register`
- `POST http://localhost:8080/api/auth/login`
- `GET http://localhost:8080/api/catalog/api/v1/products/`
- `POST http://localhost:8080/api/ordering/api/v1/carts`
- `POST http://localhost:8080/api/ordering/api/v1/orders/checkout`
- `GET http://localhost:8080/api/fulfillment/seller/orders`
- `GET http://localhost:8080/api/notification/api/v1/notifications?userId=user-demo-001`

## Smoke test the MVP flow by API

Create a cart:

```powershell
$cart = Invoke-RestMethod -Method Post http://localhost:8083/api/v1/carts -ContentType 'application/json' -Body '{"userId":"user-demo-001","currency":"VND"}'
$cartId = $cart.data.id
```

Add a product:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8083/api/v1/carts/$cartId/items" -ContentType 'application/json' -Body '{"productId":"1","sellerId":"1","name":"Tai nghe Chong on Pro","quantity":1,"unitPrice":2490000}'
```

Checkout:

```powershell
$order = Invoke-RestMethod -Method Post http://localhost:8083/api/v1/orders/checkout -ContentType 'application/json' -Body (@{
  userId = "user-demo-001"
  cartId = $cartId
  shippingAddress = @{
    recipientName = "Demo User"
    phone = "0900000000"
    line1 = "123 Nguyen Trai"
    ward = "Ward 1"
    district = "District 1"
    city = "Ho Chi Minh City"
    country = "VN"
  }
  paymentMethod = "COD"
} | ConvertTo-Json -Depth 5)
$order.data
```

Wait a few seconds, then inspect created fulfillment:

```powershell
Invoke-RestMethod "http://localhost:3002/fulfillments?orderId=$($order.data.orderId)"
```

Confirm, ship, deliver, and complete the seller order:

```powershell
$fulfillment = (Invoke-RestMethod "http://localhost:3002/fulfillments?orderId=$($order.data.orderId)")[0]
Invoke-RestMethod -Method Patch "http://localhost:3002/seller/orders/$($fulfillment.id)/confirm"
Invoke-RestMethod -Method Patch "http://localhost:3002/seller/orders/$($fulfillment.id)/ship" -ContentType 'application/json' -Body '{"carrier":"GHN","trackingCode":"LOCAL-001"}'
Invoke-RestMethod -Method Patch "http://localhost:3002/seller/orders/$($fulfillment.id)/deliver"
Invoke-RestMethod -Method Patch "http://localhost:3002/seller/orders/$($fulfillment.id)/complete"
```

Check order status and notifications:

```powershell
Invoke-RestMethod "http://localhost:8083/api/v1/orders/$($order.data.orderId)"
Invoke-RestMethod "http://localhost:8086/api/v1/notifications?userId=user-demo-001"
```

## Frontend test

1. Open `http://localhost:8080`.
2. Add a featured product to cart.
3. Open cart.
4. Click `Checkout COD`.
5. Use the API commands above to inspect fulfillment, order status, and notifications.

## Stop and reset

Stop containers:

```powershell
docker compose down
```

Reset all local data:

```powershell
docker compose down -v
```
