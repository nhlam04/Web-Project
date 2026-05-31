# IAM Setup & Login - Quick Guide

## 🚀 Quick Start

### 1. Setup IAM Service
```bash
cd backend/apps/iam-service
npm install
node setup-iam.js
```
→ Copy JWT secrets vào `.env` (root project)

### 2. Start Services
```bash
# IAM Service
npm start  # Port 3001

# Frontend
cd ../../frontend
npm start  # Port 3000
```

### 3. Test
- Mở http://localhost:3000
- Click "Đăng ký" → tạo tài khoản
- Đăng nhập

---

## 📁 Files Đã Tạo

**Backend:**
- `backend/apps/iam-service/setup-iam.js` - Setup script

**Frontend:**
- `src/components/auth/Login.js` - Login page
- `src/components/auth/Register.js` - Register page
- `src/components/auth/Auth.css` - Styles
- `src/components/UserMenu.js` - User dropdown
- `src/components/UserMenu.css` - Menu styles
- `src/components/ProtectedRoute.js` - Route guard
- `src/contexts/AuthContext.js` - Auth state
- `.env` - Config

---

## 🔌 API Endpoints

**Public:**
- POST `/register` - Đăng ký
- POST `/login` - Đăng nhập
- POST `/refresh` - Refresh token

**Protected:**
- GET `/me` - User info (Bearer token)

---

## 🔒 Security Features

- Account lockout: 5 failed attempts = 15 min lock
- Rate limiting: 5 login/15min, 3 register/hour
- Audit logging
- Input validation
- JWT tokens (15 min access, 7 days refresh)

---

## 🐛 Troubleshooting

**IAM không start:**
```bash
node setup-iam.js  # Generate secrets
```

**Database error:**
```sql
CREATE DATABASE IF NOT EXISTS iam;
```

**CORS error:**
```env
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 📝 Configuration

**.env (root):**
```env
JWT_SECRET=<from-setup-script>
JWT_REFRESH_SECRET=<from-setup-script>
ALLOWED_ORIGINS=http://localhost:3000
```

**frontend/.env:**
```env
REACT_APP_IAM_URL=http://localhost:3001
```
