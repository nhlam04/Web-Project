# Web-Project - Hệ thống quản lý bán hàng theo kiến trúc Microservices

Dự án này được xây dựng theo kiến trúc Microservices, tập trung vào khả năng mở rộng, bảo mật, tách biệt nghiệp vụ và khả năng vận hành bằng Docker.

## Tổng quan hệ thống

Hệ thống gồm các thành phần chính:

- **Frontend**: Giao diện người dùng được xây dựng bằng Vite và React.
- **API Gateway**: Nginx đóng vai trò cổng truy cập duy nhất cho frontend và các API phía sau.
- **IAM Service**: Quản lý đăng ký, đăng nhập, xác thực, phân quyền và đổi mật khẩu.
- **Catalog Service**: Quản lý danh mục và sản phẩm.
- **Ordering Service**: Quản lý giỏ hàng, đặt hàng và thông tin đơn hàng.
- **Fulfillment Service**: Quản lý quy trình xử lý đơn hàng của người bán.
- **Notification Service**: Quản lý thông báo cho người dùng.
- **Chat/Catalog Chat**: Hỗ trợ chức năng chat/tư vấn liên quan đến catalog.
- **MySQL**: Lưu trữ dữ liệu cho các service.
- **RabbitMQ**: Message broker dùng để trao đổi sự kiện bất đồng bộ giữa các service.

## Cơ cấu hạ tầng

Hệ thống sử dụng Docker Compose để quản lý toàn bộ các thành phần cốt lõi:

- **API Gateway (Nginx)**: Cổng truy cập chính, mặc định chạy tại `http://localhost:8080`.
- **Database (MySQL 8.0)**: Hệ quản trị cơ sở dữ liệu tập trung, được tách thành nhiều database độc lập cho từng service.
- **Message Broker (RabbitMQ)**: Trung tâm điều phối sự kiện giữa các service.
- **IAM Service (Node.js)**: Dịch vụ quản lý định danh, xác thực và phân quyền.
- **Catalog Service (Python/FastAPI)**: Dịch vụ quản lý catalog và sản phẩm.
- **Frontend (React/Vite)**: Giao diện người dùng cho khách hàng, người bán và quản trị viên.

## IAM Service - Quản lý định danh và truy cập

IAM Service chịu trách nhiệm bảo mật cho toàn bộ hệ thống.

Các tính năng chính:

- **Đăng ký tài khoản**: Tạo tài khoản người dùng mới.
- **Đăng nhập**: Xác thực bằng username/password và trả về JWT.
- **Xác thực người dùng hiện tại**: Lấy thông tin tài khoản đang đăng nhập.
- **Phân quyền**: Bảo vệ các API nhạy cảm theo vai trò.
- **Đổi mật khẩu**: Cho phép người dùng, người bán và quản trị viên đổi mật khẩu.
- **Mã hóa mật khẩu**: Mật khẩu được băm bằng `bcrypt`.
- **Audit log**: Ghi nhận các hành động quan trọng như đăng nhập, đổi mật khẩu, lỗi xác thực.
- **Outbox Pattern**: Đảm bảo sự kiện như `UserCreated` được lưu vào database và đẩy lên RabbitMQ một cách tin cậy.

Một số API chính:

- `POST /api/auth/register`: Đăng ký tài khoản mới.
- `POST /api/auth/login`: Đăng nhập và nhận token.
- `GET /api/auth/me`: Lấy thông tin tài khoản hiện tại.
- `PATCH /api/auth/change-password`: Đổi mật khẩu tài khoản hiện tại.

Các API yêu cầu xác thực cần gửi header:

```http
Authorization: Bearer <token>
```

## Cơ sở dữ liệu

Hệ thống khởi tạo sẵn các database sau:

- `iam`: Lưu người dùng, refresh token, audit log và outbox event.
- `catalog`: Lưu danh mục, sản phẩm và dữ liệu catalog mẫu.
- `ordering`: Lưu giỏ hàng, đơn hàng và địa chỉ giao hàng.
- `fulfillment`: Lưu tiến trình xử lý đơn hàng của người bán.
- `review`: Sẵn sàng cho chức năng đánh giá.
- `chat`: Sẵn sàng cho chức năng chat.
- `notification`: Lưu thông báo người dùng.

## Danh mục và dữ liệu mẫu

Catalog Service có dữ liệu mẫu cho các nhóm danh mục chính:

- Thời Trang Nam
- Thời Trang Nữ
- Điện Thoại & Phụ Kiện
- Mẹ & Bé
- Thiết Bị Điện Tử
- Nhà Cửa & Đời Sống
- Máy Tính & Laptop
- Sắc Đẹp
- Máy Ảnh & Máy Quay Phim
- Sức Khỏe

Khi chạy bằng Docker Compose, hệ thống có thể seed lại danh mục và sản phẩm mẫu tùy theo biến môi trường cấu hình trong Docker.

## Hướng dẫn khởi chạy bằng Docker

Yêu cầu máy đã cài đặt:

- Docker
- Docker Compose

### 1. Truy cập thư mục dự án

```bash
cd Web-Project
```

### 2. Khởi động toàn bộ hệ thống

```bash
docker compose up -d --build
```

Hoặc nếu môi trường đang dùng cú pháp cũ:

```bash
docker-compose up -d --build
```

### 3. Kiểm tra trạng thái container

```bash
docker compose ps
```

### 4. Truy cập hệ thống

- Frontend qua API Gateway: `http://localhost:8080`
- Frontend container trực tiếp: `http://localhost:3000`
- RabbitMQ Management: `http://localhost:15672`
  - Tài khoản: `admin`
  - Mật khẩu: `admin123`

## Tài khoản khởi tạo mặc định

Khi chạy `docker compose up -d --build`, IAM Service tự động đảm bảo có sẵn một số tài khoản mặc định nếu chưa tồn tại.

| Vai trò | Tên đăng nhập | Mật khẩu | Trạng thái |
| --- | --- | --- | --- |
| Quản trị viên | `admin` | `admin123` | `ACTIVE` |
| Người bán | `seller_test` | `seller123` hoặc theo cấu hình seed hiện tại | `ACTIVE` |

Người bán mặc định có thể được gắn với ID:

```text
2b93c32a-5d0f-11f1-bad3-6a081412c2c3
```

Catalog Service dùng ID này thông qua biến môi trường `CATALOG_SEED_SELLER_ID` để gán sản phẩm mẫu cho người bán khởi tạo.

Khi `CATALOG_FORCE_SEED=true`, Catalog Service sẽ seed lại đầy đủ danh mục và sản phẩm mẫu lúc container khởi động.

## Giao tiếp liên dịch vụ bằng sự kiện

Khi một người dùng được tạo, IAM Service phát sự kiện vào exchange `microservices_events` trên RabbitMQ.

Các service khác như Notification, Catalog hoặc Fulfillment có thể tạo queue và bind vào exchange này để lắng nghe dữ liệu.

Cách tiếp cận này giúp các service giao tiếp bất đồng bộ, giảm phụ thuộc trực tiếp và tăng khả năng mở rộng.

## Chạy Catalog API và Frontend riêng lẻ

Nếu muốn chạy Catalog API và Frontend riêng mà không dùng toàn bộ Docker Compose, có thể thực hiện các bước sau.

### 1. Thiết lập cơ sở dữ liệu

1. Tạo database mới tên `qlbanhang`.
2. Khuyến nghị dùng collation `utf8mb4_general_ci` để hỗ trợ tiếng Việt tốt.
3. Import file `qlbanhang.sql` ở thư mục gốc vào database vừa tạo.
4. Nếu có cấu hình mật khẩu MySQL riêng, cập nhật `DATABASE_URL` trong file cấu hình tương ứng của Catalog Service.

### 2. Thiết lập và chạy Catalog API

Truy cập thư mục Catalog Service:

```bash
cd catalog_chat
```

Tạo môi trường ảo Python:

```bash
python -m venv venv
```

Kích hoạt môi trường ảo trên Windows:

```bash
.\venv\Scripts\activate
```

Cài đặt thư viện:

```bash
pip install -r requirements.txt
```

Khởi chạy server:

```bash
python run.py
```

FastAPI mặc định chạy tại:

```text
http://127.0.0.1:8000
```

Tài liệu Swagger:

```text
http://127.0.0.1:8000/docs
```

### 3. Thiết lập và chạy Frontend

Mở terminal mới và truy cập thư mục frontend:

```bash
cd frontend
```

Cài đặt gói phụ thuộc:

```bash
npm install
```

Chạy giao diện ở môi trường phát triển:

```bash
npm run dev
```

Frontend dev server mặc định chạy tại:

```text
http://localhost:3000
```

## Kiến trúc frontend

Frontend hiện được tổ chức theo kiến trúc Vite + React Router với các nhóm thư mục chính:

- `src/pages`: Các trang chính theo vai trò và nghiệp vụ.
- `src/layouts`: Layout dùng chung cho khách hàng, người bán và quản trị viên.
- `src/components`: Component dùng chung và component theo từng domain.
- `src/services`: Các service gọi API.
- `src/utils`: Tiện ích, hằng số và hàm dùng chung.
- `src/store`: Nơi có thể đặt state management nếu cần mở rộng.

Biến môi trường phía client dùng tiền tố `VITE_`, ví dụ:

```env
VITE_CATALOG_URL=/api/catalog
```

Giao diện frontend dùng font stack hỗ trợ tiếng Việt và các nội dung hiển thị chính đã được chuẩn hóa sang tiếng Việt có dấu.

## Checkout và địa chỉ giao hàng

Khách hàng đi qua trang `/checkout` để cập nhật địa chỉ giao hàng trước khi đặt đơn COD.

Địa chỉ giao hàng được gửi vào Ordering API trong trường `shippingAddress` và được lưu ở bảng:

```text
ordering.orders.shipping_address
```

Thông tin này được dùng để hiển thị lại trong danh sách đơn hàng, chi tiết đơn hàng và quy trình fulfillment.

## Công nghệ sử dụng

- React
- Vite
- React Router
- Node.js
- Python/FastAPI
- MySQL
- RabbitMQ
- Nginx
- Docker
- Docker Compose