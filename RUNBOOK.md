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
- `GET http://localhost:8080/api/catalog/api/v1/products/seller` with header `x-seller-id`
- `POST http://localhost:8080/api/catalog/api/v1/products/seller` with header `x-seller-id`
- `PUT http://localhost:8080/api/catalog/api/v1/products/seller/{productId}` with header `x-seller-id`
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

## Seller product API

Seller product APIs are exposed through the Catalog Service and require the logged-in seller IAM id in the `x-seller-id` header. A seeded local seller is usually:

- Username: `seller_test`
- Password: `seller123456`

Find the seller id:

```powershell
docker compose exec -T mysql mysql -uadmin -ppassword123 iam -e "SELECT id, username, role FROM users WHERE username='seller_test';"
```

Create a product:

```powershell
$sellerId = "2b93c32a-5d0f-11f1-bad3-6a081412c2c3"
$productBody = @{
  name = "Seller Demo Product"
  price = 125000
  shortDesc = "Created by seller product API"
  detailDesc = @{ warranty = "12 months" }
  quantity = 9
  images = @("https://via.placeholder.com/320?text=Seller+Product")
  catalog_id = 1
} | ConvertTo-Json -Depth 5

$created = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/api/catalog/api/v1/products/seller" `
  -Headers @{ "x-seller-id" = $sellerId } `
  -ContentType "application/json" `
  -Body $productBody
```

Update the product:

```powershell
$updateBody = @{ price = 130000; quantity = 12 } | ConvertTo-Json
Invoke-RestMethod `
  -Method Put `
  -Uri "http://localhost:8080/api/catalog/api/v1/products/seller/$($created.id)" `
  -Headers @{ "x-seller-id" = $sellerId } `
  -ContentType "application/json" `
  -Body $updateBody
```

List products for the seller:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:8080/api/catalog/api/v1/products/seller?skip=0&limit=20" `
  -Headers @{ "x-seller-id" = $sellerId }
```

The update endpoint returns `403` if `x-seller-id` does not match the product `shopId`.

## Frontend test

1. Open `http://localhost:8080`.
2. Add a featured product to cart.
3. Open cart.
4. Click `Checkout COD`.
5. Use the API commands above to inspect fulfillment, order status, and notifications.

Seller product UI:

1. Login with a `SELLER` account.
2. Open `http://localhost:8080/seller/products`.
3. Click `Tạo sản phẩm`.
4. Fill product fields and save.
5. Use `Sửa` in the seller product table to update that product.

Frontend text note:

- The landing page, customer pages, seller/admin dashboards, and chat widget use UTF-8 Vietnamese text with accents.
- The shared frontend font stack is `"Inter", "Segoe UI", Arial, sans-serif` so Vietnamese glyphs render correctly on the landing and dashboard shells.

## Stop and reset

Stop containers:

```powershell
docker compose down
```

Reset all local data:

```powershell
docker compose down -v
```
