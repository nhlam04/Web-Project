# Sổ tay vận hành cục bộ

Tài liệu này hướng dẫn cách khởi chạy, kiểm thử nhanh và đặt lại môi trường phát triển cục bộ của hệ thống.

## Khởi động toàn bộ hệ thống

Chạy lệnh sau tại thư mục gốc của dự án:

```powershell
docker compose up --build
```

Nếu muốn chạy ở chế độ nền, dùng:

```powershell
docker compose up -d --build
```

Các địa chỉ cần mở sau khi hệ thống khởi động:

- Frontend thông qua API Gateway: `http://localhost:8080`
- Frontend container trực tiếp: `http://localhost:3000`
- RabbitMQ Management: `http://localhost:15672`
  - Tài khoản: `admin`
  - Mật khẩu: `admin123`

## Các URL service chính trên môi trường cục bộ

- IAM Service: `http://localhost:3001`
- Catalog Service: `http://localhost:8000`
- Ordering Service: `http://localhost:8083`
- Fulfillment Service: `http://localhost:3002`
- Notification Service: `http://localhost:8086`
- API Gateway: `http://localhost:8080`

## Các tiền tố API thông qua Gateway

Một số endpoint thường dùng qua API Gateway:

- `POST http://localhost:8080/api/auth/register`
- `POST http://localhost:8080/api/auth/login`
- `GET http://localhost:8080/api/auth/me`
- `PATCH http://localhost:8080/api/auth/change-password`
- `GET http://localhost:8080/api/catalog/api/v1/catalogs/`
- `GET http://localhost:8080/api/catalog/api/v1/products/`
- `GET http://localhost:8080/api/catalog/api/v1/products/seller` với header `x-seller-id`
- `POST http://localhost:8080/api/catalog/api/v1/products/seller` với header `x-seller-id`
- `PUT http://localhost:8080/api/catalog/api/v1/products/seller/{productId}` với header `x-seller-id`
- `POST http://localhost:8080/api/ordering/api/v1/carts`
- `POST http://localhost:8080/api/ordering/api/v1/orders/checkout`
- `GET http://localhost:8080/api/fulfillment/seller/orders`
- `GET http://localhost:8080/api/notification/api/v1/notifications?userId=user-demo-001`

Ordering Service lưu địa chỉ giao hàng lúc checkout trong cột:

```text
ordering.orders.shipping_address
```

Dữ liệu được lưu dưới dạng JSON/JSONB tùy cấu hình database. Migration lúc khởi động của Ordering Service cũng đảm bảo bổ sung cột `shipping_address` nếu database cục bộ cũ chưa có cột này.

## Kiểm thử nhanh luồng MVP bằng API

Phần này dùng PowerShell để kiểm thử nhanh luồng: tạo giỏ hàng, thêm sản phẩm, đặt hàng, tạo fulfillment, cập nhật trạng thái giao hàng và kiểm tra thông báo.

### 1. Tạo giỏ hàng

```powershell
$cart = Invoke-RestMethod -Method Post http://localhost:8083/api/v1/carts -ContentType 'application/json' -Body '{"userId":"user-demo-001","currency":"VND"}'
$cartId = $cart.data.id
```

### 2. Thêm sản phẩm vào giỏ hàng

```powershell
Invoke-RestMethod -Method Post "http://localhost:8083/api/v1/carts/$cartId/items" -ContentType 'application/json' -Body '{"productId":"1","sellerId":"1","name":"Tai nghe Chống ồn Pro","quantity":1,"unitPrice":2490000}'
```

### 3. Checkout đơn hàng

```powershell
$order = Invoke-RestMethod -Method Post http://localhost:8083/api/v1/orders/checkout -ContentType 'application/json' -Body (@{
  userId = "user-demo-001"
  cartId = $cartId
  shippingAddress = @{
    recipientName = "Người dùng Demo"
    phone = "0900000000"
    line1 = "123 Nguyễn Trãi"
    ward = "Phường 1"
    district = "Quận 1"
    city = "Thành phố Hồ Chí Minh"
    country = "VN"
  }
  paymentMethod = "COD"
} | ConvertTo-Json -Depth 5)

$order.data
```

Đối tượng `shippingAddress` là bắt buộc và cần có các trường sau:

- `recipientName`: Tên người nhận.
- `phone`: Số điện thoại.
- `line1`: Địa chỉ cụ thể.
- `ward`: Phường/xã.
- `district`: Quận/huyện.
- `city`: Tỉnh/thành phố.
- `country`: Quốc gia.

Trang frontend `/checkout` thu thập và tái sử dụng địa chỉ này trước khi gọi API checkout.

### 4. Kiểm tra fulfillment được tạo

Chờ vài giây để các service xử lý sự kiện, sau đó chạy:

```powershell
Invoke-RestMethod "http://localhost:3002/fulfillments?orderId=$($order.data.orderId)"
```

### 5. Xác nhận, giao hàng và hoàn tất đơn của người bán

```powershell
$fulfillment = (Invoke-RestMethod "http://localhost:3002/fulfillments?orderId=$($order.data.orderId)")[0]

Invoke-RestMethod -Method Patch "http://localhost:3002/seller/orders/$($fulfillment.id)/confirm"

Invoke-RestMethod -Method Patch "http://localhost:3002/seller/orders/$($fulfillment.id)/ship" -ContentType 'application/json' -Body '{"carrier":"GHN","trackingCode":"LOCAL-001"}'

Invoke-RestMethod -Method Patch "http://localhost:3002/seller/orders/$($fulfillment.id)/deliver"

Invoke-RestMethod -Method Patch "http://localhost:3002/seller/orders/$($fulfillment.id)/complete"
```

### 6. Kiểm tra trạng thái đơn hàng và thông báo

```powershell
Invoke-RestMethod "http://localhost:8083/api/v1/orders/$($order.data.orderId)"

Invoke-RestMethod "http://localhost:8086/api/v1/notifications?userId=user-demo-001"
```

## API sản phẩm dành cho người bán

Các API sản phẩm dành cho người bán được cung cấp thông qua Catalog Service.

Các API này yêu cầu ID người bán đang đăng nhập trong header:

```http
x-seller-id: <seller-id>
```

Người bán cục bộ được seed thường là:

- Tên đăng nhập: `seller_test`
- Mật khẩu: `seller123` hoặc `seller123456` tùy dữ liệu seed hiện tại.

### 1. Tìm ID người bán

```powershell
docker compose exec -T mysql mysql -uadmin -ppassword123 iam -e "SELECT id, username, role FROM users WHERE username='seller_test';"
```

ID người bán mặc định thường là:

```text
2b93c32a-5d0f-11f1-bad3-6a081412c2c3
```

### 2. Tạo sản phẩm

```powershell
$sellerId = "2b93c32a-5d0f-11f1-bad3-6a081412c2c3"

$productBody = @{
  name = "Sản phẩm demo của người bán"
  price = 125000
  shortDesc = "Sản phẩm được tạo bằng API dành cho người bán"
  detailDesc = @{ warranty = "12 tháng" }
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

### 3. Cập nhật sản phẩm

```powershell
$updateBody = @{ price = 130000; quantity = 12 } | ConvertTo-Json

Invoke-RestMethod `
  -Method Put `
  -Uri "http://localhost:8080/api/catalog/api/v1/products/seller/$($created.id)" `
  -Headers @{ "x-seller-id" = $sellerId } `
  -ContentType "application/json" `
  -Body $updateBody
```

### 4. Liệt kê sản phẩm của người bán

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:8080/api/catalog/api/v1/products/seller?skip=0&limit=20" `
  -Headers @{ "x-seller-id" = $sellerId }
```

Endpoint cập nhật sản phẩm trả về `403` nếu `x-seller-id` không khớp với `shopId` của sản phẩm.

## Kiểm thử frontend

### Luồng khách hàng

1. Mở `http://localhost:8080`.
2. Đăng nhập bằng tài khoản khách hàng hoặc đăng ký tài khoản mới.
3. Thêm một sản phẩm nổi bật vào giỏ hàng.
4. Mở giỏ hàng.
5. Bấm `Nhập địa chỉ giao hàng`.
6. Điền form địa chỉ giao hàng tại `/checkout`.
7. Bấm `Đặt hàng COD`.
8. Dùng các lệnh API ở phần trên để kiểm tra fulfillment, trạng thái đơn hàng, địa chỉ giao hàng và thông báo.

### Luồng người bán

1. Đăng nhập bằng tài khoản có vai trò `SELLER`.
2. Mở `http://localhost:8080/seller/products`.
3. Bấm `Tạo sản phẩm`.
4. Điền thông tin sản phẩm và lưu.
5. Dùng nút `Sửa` trong bảng sản phẩm của người bán để cập nhật sản phẩm đó.
6. Mở `http://localhost:8080/seller/orders` để theo dõi và xử lý đơn hàng.

### Luồng quản trị viên

1. Đăng nhập bằng tài khoản có vai trò `ADMIN`.
2. Mở `http://localhost:8080/admin`.
3. Kiểm tra màn tổng quan quản trị.
4. Mở `http://localhost:8080/admin/users` để quản lý người dùng.
5. Mở `http://localhost:8080/admin/change-password` nếu cần đổi mật khẩu quản trị viên.

## Ghi chú về giao diện tiếng Việt

- Landing page, các trang khách hàng, dashboard người bán, dashboard quản trị viên và chat widget dùng tiếng Việt có dấu.
- Font stack dùng chung là `"Inter", "Segoe UI", Arial, sans-serif`, hỗ trợ hiển thị tiếng Việt tốt.
- Các nội dung hướng dẫn người dùng nên tiếp tục được viết bằng tiếng Việt có dấu để thống nhất trải nghiệm.

## Dừng và đặt lại môi trường

### Dừng container

```powershell
docker compose down
```

### Dừng container và xóa toàn bộ dữ liệu cục bộ

```powershell
docker compose down -v
```

Lệnh `docker compose down -v` sẽ xóa volume dữ liệu, bao gồm dữ liệu MySQL và RabbitMQ cục bộ. Chỉ dùng khi muốn reset toàn bộ môi trường.