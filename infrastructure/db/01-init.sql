-- 1. Tạo các Database cho từng Service
CREATE DATABASE IF NOT EXISTS iam;
CREATE DATABASE IF NOT EXISTS catalog; -- Đổi tên qlbanhang thành catalog cho chuẩn Microservices
CREATE DATABASE IF NOT EXISTS review;
CREATE DATABASE IF NOT EXISTS ordering;
CREATE DATABASE IF NOT EXISTS fulfillment;
CREATE DATABASE IF NOT EXISTS chat;
CREATE DATABASE IF NOT EXISTS notification;

-- Cấp quyền cho user 'admin' truy cập tất cả DB
GRANT ALL PRIVILEGES ON *.* TO 'admin'@'%';
FLUSH PRIVILEGES;

-- 2. Khởi tạo bảng cho IAM Service
USE iam;

CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'USER'
);

CREATE TABLE IF NOT EXISTS roles (
    id CHAR(36) PRIMARY KEY,
    role_name VARCHAR(20) NOT NULL
);

-- Bảng lưu trữ Refresh Token
CREATE TABLE IF NOT EXISTS refresh_tokens (
    token VARCHAR(500) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng Outbox Pattern
CREATE TABLE IF NOT EXISTS outbox_events (
    id CHAR(36) PRIMARY KEY,
    event_type VARCHAR(100),
    payload JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);