# Web-Project - He Thong Quan Ly Ban Hang (Microservices)

Du an nay duoc xay dung theo kien truc Microservices, tap trung vao tinh mo rong, bao mat va kha nang chiu tai cao.

## Co Cau Ha Tang (Infrastructure)

He thong su dung Docker Compose de quan ly toan bo cac thanh phan cot loi:

- API Gateway (Nginx): Cua ngo duy nhat (Cong 80) tiep nhan va dieu huong request tu Frontend.
- Database (MySQL 8.0): He quan tri du lieu tap trung, duoc phan tach thanh 7 database doc lap cho tung service.
- Message Broker (RabbitMQ): Trung tam dieu phoi su kien (Events) giua cac dich vu theo co che bat dong bo.
- IAM Service (Node.js): Dich vu quan ly dinh danh va quyen truy cap.

## IAM Service (Identity & Access Management)

Dich vu nay chiu trach nhiem bao mat cho toan bo he thong.

Tinh nang chinh:
- Authentication: Dang ky va Dang nhap su dung JWT (JSON Web Token). Mat khau duoc ma hoa bang `bcryptjs`.
- Authorization: Middleware bao ve cac API nhay cam.
- Outbox Pattern: Dam bao su kien `UserCreated` duoc luu vao DB va day len RabbitMQ mot cach tin cay (Atomic Transaction).

Danh muc API:
- POST /api/auth/register: Dang ky tai khoan moi.
- POST /api/auth/login: Dang nhap lay Token.
- GET /api/auth/me: Lay thong tin ca nhan (Yeu cau Header `Authorization: Bearer <token>`).

## Co So Du Lieu (MySQL)

He thong da khoi tao san cac database sau:
- iam: Luu tru nguoi dung va su kien outbox.
- catalog: Du lieu san pham (da tich hop du lieu mau).
- ordering, fulfillment, review, chat, notification: San sang cho cac service tiep theo.

## Huong Dan Khoi Chay (Docker)

Yeu cau may cai dat Docker va Docker Compose.

1. Clone du an va truy cap thu muc goc:
   ```bash
   cd Web-Project
   ```

2. Khoi dong toan bo he thong:
   ```bash
   docker-compose up -d --build
   ```

3. Kiem tra trang thai:
   ```bash
   docker-compose ps
   ```

4. Truy cap Dashboard RabbitMQ:
   Dia chi: http://localhost:15672 (User/Pass: guest / guest).

## Giao Tiep Lien Dich Vu (Events)

Khi mot User duoc tao, IAM Service se ban mot su kien vao Exchange `microservices_events` tren RabbitMQ. Cac service khac (nhu Notification, Catalog) co the tao Queue va bind vao Exchange nay de lang nghe du lieu.

## Catalog API + Frontend (Standalone)

Neu ban muon chay Catalog API (Python) va Frontend (React) rieng biet khong qua Docker Compose, dung cac buoc sau.

### 1. Thiet lap Co so du lieu

1. Tao database moi ten la qlbanhang (Collation khuyen nghi: utf8mb4_general_ci).
2. Import file qlbanhang.sql o thu muc goc vao database vua tao.
3. Neu ban dat mat khau MySQL, cap nhat `DATABASE_URL` trong [catalog/app/core/config.py](catalog/app/core/config.py).

### 2. Thiet lap va chay Backend (Catalog API)

1. Mo terminal, truy cap thu muc catalog:
   ```bash
   cd catalog
   ```

2. Tao va kich hoat moi truong ao (khuyen nghi):
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. Cai dat thu vien:
   ```bash
   pip install -r requirements.txt
   ```

4. Khoi chay server:
   ```bash
   python run.py
   ```

Server FastAPI mac dinh chay o http://127.0.0.1:8000. Tai lieu Swagger: http://127.0.0.1:8000/docs.

### 3. Thiet lap va chay Frontend

1. Mo terminal moi, truy cap thu muc frontend:
   ```bash
   cd frontend
   ```

2. Cai dat goi phu thuoc:
   ```bash
   npm install
   npm install react-router-dom
   ```

3. Chay giao dien:
   ```bash
   npm start
   ```

React Server se chay o http://localhost:3000.

Cong nghe: Node.js, MySQL, RabbitMQ, Nginx, Docker.
