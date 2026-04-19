# Sử dụng image Node.js bản nhẹ (alpine)
FROM node:18-alpine

# Chỉ định thư mục làm việc bên trong container
WORKDIR /app

# Copy các file định nghĩa thư viện vào trước
COPY package*.json ./

# Cài đặt các thư viện (express, pg)
RUN npm install

# Copy toàn bộ mã nguồn (server.js,...) vào container
COPY . .

# Mở cổng 3001 cho dịch vụ
EXPOSE 3001

# Lệnh khởi chạy server
CMD ["npm", "start"]