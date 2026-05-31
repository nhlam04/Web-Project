# IAM Service

## Quick Start

```bash
npm install
node setup-iam.js  # Generate secrets + run migrations
npm start          # Port 3001
```

## API Endpoints

**Public:**
- POST `/register` - Register user
- POST `/login` - Login (returns JWT)
- POST `/refresh` - Refresh token

**Protected:**
- GET `/me` - Get user info (Bearer token)
- GET `/admin/dashboard` - Admin only

## Security

- Account lockout: 5 fails = 15 min lock
- Rate limit: 5 login/15min, 3 register/hour
- Audit logging
- JWT: 15 min access, 7 days refresh

## Database

Tables: `users`, `audit_logs`, `refresh_tokens`, `outbox_events`

Migrations in `migrations/` folder.

## Config (.env)

```env
DB_HOST=localhost
DB_USER=admin
DB_PASS=***
DB_NAME=iam
JWT_SECRET=<32+ chars>
JWT_REFRESH_SECRET=<32+ chars>
ALLOWED_ORIGINS=http://localhost:3000
```

## Troubleshooting

**JWT secret error:** Run `node setup-iam.js`

**DB error:** Check MySQL running, create `iam` database

**CORS error:** Add frontend URL to `ALLOWED_ORIGINS`
