# IAM Service 

## 🚀 Deployment Steps

### 1. Backup Database
```bash
mysqldump -u admin -p iam > backup.sql
```

### 2. Install Dependencies
```bash
cd D:\IT\Web-Project\backend\apps\iam-service
npm install
```

### 3. Run Migrations
```bash
mysql -u admin -p iam < migrations\001_add_account_lockout.sql
mysql -u admin -p iam < migrations\002_add_audit_logging.sql
```

### 4. Verify Database
```sql
DESCRIBE users;  -- Should see: failed_login_attempts, locked_until
DESCRIBE audit_logs;  -- Should exist
```

### 5. Configure .env
```bash
# Set these in .env:
JWT_SECRET=<32+ characters>
JWT_REFRESH_SECRET=<32+ characters>
ALLOWED_ORIGINS=http://localhost:3000
```

### 6. Start Service
```bash
npm start
```
