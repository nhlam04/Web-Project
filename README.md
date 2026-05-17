# Project Web Nhóm 16 - Quản Lý Bán Hàng

Dự án bao gồm 2 thành phần chính kết nối với nhau: 
- **Backend (Catalog API)**: Được xây dựng bằng Python (FastAPI, SQLAlchemy).
- **Frontend**: Hoạt động dưới dạng Single Page Application bằng React.js.

## 🛠 Yêu cầu hệ thống cần chuẩn bị
- **Python**: Phiên bản 3.9 trở lên để chạy máy chủ backend.
- **Node.js**: Phiên bản 16 trở lên (đi kèm với npm) để chạy giao diện.
- **MySQL / MariaDB**: Bạn có thể dùng XAMPP, WAMP hoặc MySQL Server độc lập.

---

## 1. Thiết lập Cơ sở dữ liệu (Database)
1. Mở ứng dụng MySQL (Ví dụ: Start MySQL trong XAMPP Control Panel).
2. Tạo một database mới có tên là `qlbanhang` (với Collation khuyến nghị là `utf8mb4_general_ci`).
3. Import thẳng file `qlbanhang.sql` nằm ở thư mục gốc của dự án vào database `qlbanhang` vừa tạo để nạp sẵn cấu trúc các bảng và dữ liệu.
*(Lưu ý: Nếu bạn cài đặt mật khẩu cho MySQL ở máy tính của bạn thì nhớ vào file `catalog/app/core/config.py` cập nhật tham số `DATABASE_URL` nhé!)*

---

## 2. Thiết lập và chạy Backend (Catalog API)
Backend cung cấp các đầu mối API CRUD về sản phẩm và người dùng.

**Bước 1:** Mở terminal, truy cập vào thư mục `catalog`:
```bash
cd catalog
```

**Bước 2:** Khởi tạo môi trường ảo hóa (Khuyến nghị) và kích hoạt nó:
- Trên Windows:
  ```bash
  python -m venv venv
  .\venv\Scripts\activate
  ```

**Bước 3:** Cài đặt các thư viện cần dùng từ file requirements:
```bash
pip install -r requirements.txt
```

**Bước 4:** Khởi chạy Backend Server:
```bash
python run.py
```
> ⚡ Server FastAPI mặc định chạy ở địa chỉ: `http://127.0.0.1:8000`. Bạn có thể truy cập trực tiếp `http://127.0.0.1:8000/docs` để xem tài liệu Swagger UI và test các APIs.

---

## 3. Thiết lập và chạy Frontend
Frontend hiển thị giao diện UI và giao tiếp liên tục với máy chủ Backend.

**Bước 1:** Mở một cửa sổ terminal mới, di chuyển vào thư mục `frontend`:
```bash
cd frontend
```

**Bước 2:** Cài đặt các node_modules và cấu trúc định tuyến cho React:
```bash
npm install
npm install react-router-dom
```

**Bước 3:** Chạy Server giao diện:
```bash
npm start
```
> ⚡ React Server sẽ khởi động ở `http://localhost:3000`. Hệ thống sẽ mở thẳng Landing Page vào trình duyệt mặc định của bạn. 
> - Truy cập `http://localhost:3000/product-list` để xem danh sách sản phẩm.
> - Chi tiết sản phẩm có thể xem tại route `http://localhost:3000/product-detail/:slug`.

Chúc các bạn phát triển web vui vẻ!
