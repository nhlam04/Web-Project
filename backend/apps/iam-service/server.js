const express = require('express');
const mysql = require('mysql2/promise');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { setPool: setAuditPool, logAudit, getClientIp, getUserAgent } = require('./audit');
const { validateUsername, validateRefreshToken, validateRequiredFields } = require('./validation');
const app = express();

// ============================================
// FIX 4: Security Headers
// ============================================
// Helmet: Set security headers
app.use(helmet());

// CORS: Configure allowed origins
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

const PORT = process.env.PORT || 3001;
const ALLOWED_ACCOUNT_ROLES = new Set(['CUSTOMER', 'SELLER']);

// Tạo kết nối (Pool) tới MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASS || 'password123',
    database: process.env.DB_NAME || 'iam',
    waitForConnections: true,
    connectionLimit: 10
});

// Initialize audit logger with pool
setAuditPool(pool);

async function ensureIamSchema() {
    await pool.query("ALTER TABLE users MODIFY role VARCHAR(20) DEFAULT 'CUSTOMER'");
    await pool.query("UPDATE users SET role = 'CUSTOMER' WHERE role IS NULL OR role = '' OR role = 'USER'");
}

// API Kiểm tra trạng thái & DB
app.get('/health', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        res.status(200).json({ 
            status: 'UP', 
            service: 'IAM Service',
            database: 'Connected to MySQL' 
        });
    } catch (error) {
        res.status(500).json({ status: 'DOWN', error: error.message });
    }
});

// Demo chat user list (IAM is the source of truth).
app.get('/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, username, role FROM users ORDER BY username');
        res.status(200).json({ data: rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// ============================================
// FIX 1: JWT Secret Validation
// ============================================
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.error('❌ LỖI: JWT_SECRET phải có ít nhất 32 ký tự!');
    console.error('Tạo secret mới: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
}

if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
    console.error('❌ LỖI: JWT_REFRESH_SECRET phải có ít nhất 32 ký tự!');
    process.exit(1);
}

// ============================================
// FIX 2: Password Validation Function
// ============================================
function validatePassword(password) {
    if (!password || password.length < 8) {
        return { valid: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' };
    }
    if (!/[a-zA-Z]/.test(password)) {
        return { valid: false, error: 'Mật khẩu phải có ít nhất 1 chữ cái' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Mật khẩu phải có ít nhất 1 chữ số' };
    }
    return { valid: true };
}

// ============================================
// FIX 3: Rate Limiting
// ============================================
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5, // Tối đa 5 lần
    message: { error: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.' }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 3, // Tối đa 3 tài khoản
    message: { error: 'Quá nhiều lần đăng ký. Vui lòng thử lại sau 1 giờ.' }
});

// -----------------------------------------
// 1. API Đăng ký (Nâng cấp Outbox Pattern)
// -----------------------------------------
app.post('/register', registerLimiter, async (req, res) => {
    const { username, password } = req.body;
    const requestedRole = String(req.body.role || 'CUSTOMER').toUpperCase();
    
    // Validate required fields
    const fieldsCheck = validateRequiredFields(req.body, ['username', 'password']);
    if (!fieldsCheck.valid) {
        await logAudit({
            eventType: 'AUTH',
            eventAction: 'REGISTER_FAILED',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { reason: fieldsCheck.error },
            responseStatus: 400
        });
        return res.status(400).json({ error: fieldsCheck.error });
    }
    
    // Validate username
    const usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) {
        await logAudit({
            eventType: 'AUTH',
            eventAction: 'REGISTER_FAILED',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { username, reason: usernameCheck.error },
            responseStatus: 400
        });
        return res.status(400).json({ error: usernameCheck.error });
    }
    
    // Validate password
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
        await logAudit({
            eventType: 'AUTH',
            eventAction: 'REGISTER_FAILED',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { username: usernameCheck.sanitized, reason: passwordCheck.error },
            responseStatus: 400
        });
        return res.status(400).json({ error: passwordCheck.error });
    }

    if (!ALLOWED_ACCOUNT_ROLES.has(requestedRole)) {
        await logAudit({
            eventType: 'AUTH',
            eventAction: 'REGISTER_FAILED',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { username: usernameCheck.sanitized, role: requestedRole, reason: 'Invalid role' },
            responseStatus: 400
        });
        return res.status(400).json({ error: 'Loai tai khoan khong hop le' });
    }
    
    // Mở một kết nối riêng để chạy Transaction
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction(); // Bắt đầu giao dịch

        // 1. Kiểm tra user trùng (dùng sanitized username)
        const sanitizedUsername = usernameCheck.sanitized;
        const [existing] = await conn.query('SELECT id FROM users WHERE username = ?', [sanitizedUsername]);
        if (existing.length > 0) {
            await conn.rollback();
            await logAudit({
                eventType: 'AUTH',
                eventAction: 'REGISTER_FAILED',
                ipAddress: getClientIp(req),
                userAgent: getUserAgent(req),
                requestData: { username: sanitizedUsername, reason: 'Username already exists' },
                responseStatus: 400
            });
            return res.status(400).json({ error: 'Tài khoản đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        // 2. Lưu user vào DB
        await conn.query(
            'INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)', 
            [userId, sanitizedUsername, hashedPassword, requestedRole]
        );

        // 3. Tạo sự kiện và lưu vào bảng Outbox
        const eventId = uuidv4();
        const payload = JSON.stringify({ userId, username: sanitizedUsername, role: requestedRole, action: 'UserCreated' });
        
        await conn.query(
            'INSERT INTO outbox_events (id, event_type, payload) VALUES (?, ?, ?)',
            [eventId, 'UserCreated', payload]
        );

        await conn.commit(); // Chốt giao dịch thành công!
        
        // Log successful registration
        await logAudit({
            userId,
            eventType: 'AUTH',
            eventAction: 'REGISTER_SUCCESS',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { username: sanitizedUsername, role: requestedRole },
            responseStatus: 201
        });
        
        res.status(201).json({ message: 'Dang ky thanh cong va da ghi nhan su kien!', userId, role: requestedRole });
    } catch (error) {
        await conn.rollback(); // Có lỗi xảy ra, hủy bỏ mọi thay đổi
        await logAudit({
            eventType: 'AUTH',
            eventAction: 'REGISTER_ERROR',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { username, error: error.message },
            responseStatus: 500
        });
        res.status(500).json({ error: error.message });
    } finally {
        conn.release(); // Trả kết nối lại cho Pool
    }
});

// -----------------------------------------
// 2. API Đăng nhập (Login) - ACCOUNT LOCKOUT DISABLED (TEMP)
// -----------------------------------------
app.post('/login', authLimiter, async (req, res) => {
    const { username, password } = req.body;
    
    // Validate required fields
    const fieldsCheck = validateRequiredFields(req.body, ['username', 'password']);
    if (!fieldsCheck.valid) {
        await logAudit({
            eventType: 'AUTH',
            eventAction: 'LOGIN_FAILED',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { reason: fieldsCheck.error },
            responseStatus: 400
        });
        return res.status(400).json({ error: fieldsCheck.error });
    }
    
    // Validate username format
    const usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) {
        await logAudit({
            eventType: 'AUTH',
            eventAction: 'LOGIN_FAILED',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { username, reason: usernameCheck.error },
            responseStatus: 400
        });
        return res.status(400).json({ error: usernameCheck.error });
    }
    
    try {
        const sanitizedUsername = usernameCheck.sanitized;
        // Tìm user trong DB (dùng sanitized username)
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [sanitizedUsername]);
        if (users.length === 0) {
            await logAudit({
                eventType: 'AUTH',
                eventAction: 'LOGIN_FAILED',
                ipAddress: getClientIp(req),
                userAgent: getUserAgent(req),
                requestData: { username: sanitizedUsername, reason: 'User not found' },
                responseStatus: 401
            });
            return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
        }

        const user = users[0];

        // Temporary: skip lockout checks to allow unlimited attempts in local testing.

        // So sánh mật khẩu
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            await logAudit({
                userId: user.id,
                eventType: 'AUTH',
                eventAction: 'LOGIN_FAILED',
                ipAddress: getClientIp(req),
                userAgent: getUserAgent(req),
                requestData: { username, reason: 'Wrong password' },
                responseStatus: 401
            });
            return res.status(401).json({
                error: 'Sai tài khoản hoặc mật khẩu.'
            });
        }

        // ============================================
        // FIX: RESET FAILED ATTEMPTS ON SUCCESS
        // ============================================
        if (user.failed_login_attempts > 0) {
            await pool.query(
                'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
                [user.id]
            );
        }

        // Tạo Access Token (Ngắn hạn - 15 phút) dùng để đi qua các trạm gác API
        const accessToken = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                role: user.role 
            }, 
            JWT_SECRET, 
            { expiresIn: '15m' }
        );

        // 2. Tạo Refresh Token (Dài hạn - 7 ngày) dùng để xin cấp lại Access Token khi hết hạn
        const refreshToken = jwt.sign(
            { userId: user.id }, 
            JWT_REFRESH_SECRET, 
            { expiresIn: '7d' }
        );

        // 3. Lưu Refresh Token vào Database để quản lý phiên đăng nhập
        await pool.query(
            'INSERT INTO refresh_tokens (token, user_id) VALUES (?, ?)', 
            [refreshToken, user.id]
        );

        // Log successful login
        await logAudit({
            userId: user.id,
            eventType: 'AUTH',
            eventAction: 'LOGIN_SUCCESS',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { username },
            responseStatus: 200
        });

        res.status(200).json({ 
            message: 'Đăng nhập thành công!', 
            accessToken,
            refreshToken
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// -----------------------------------------
// API Làm mới Token (Refresh Token)
// -----------------------------------------
app.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    
    // Validate required fields
    const fieldsCheck = validateRequiredFields(req.body, ['refreshToken']);
    if (!fieldsCheck.valid) {
        await logAudit({
            eventType: 'TOKEN',
            eventAction: 'REFRESH_FAILED',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { reason: fieldsCheck.error },
            responseStatus: 400
        });
        return res.status(400).json({ error: fieldsCheck.error });
    }
    
    // Validate refresh token format
    const tokenCheck = validateRefreshToken(refreshToken);
    if (!tokenCheck.valid) {
        await logAudit({
            eventType: 'TOKEN',
            eventAction: 'REFRESH_FAILED',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { reason: tokenCheck.error },
            responseStatus: 400
        });
        return res.status(400).json({ error: tokenCheck.error });
    }
    
    const sanitizedToken = tokenCheck.sanitized;

    try {
        // Kiểm tra token có nằm trong Database không (đề phòng đã bị thu hồi)
        const [rows] = await pool.query('SELECT * FROM refresh_tokens WHERE token = ?', [sanitizedToken]);
        if (rows.length === 0) {
            await logAudit({
                eventType: 'TOKEN',
                eventAction: 'REFRESH_FAILED',
                ipAddress: getClientIp(req),
                userAgent: getUserAgent(req),
                requestData: { reason: 'Token not found or revoked' },
                responseStatus: 403
            });
            return res.status(403).json({ error: 'Refresh Token không hợp lệ hoặc đã bị thu hồi' });
        }

        // Xác minh Refresh Token
        jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, payload) => {
            if (err) {
                await logAudit({
                    eventType: 'TOKEN',
                    eventAction: 'REFRESH_FAILED',
                    ipAddress: getClientIp(req),
                    userAgent: getUserAgent(req),
                    requestData: { reason: 'Token expired or invalid' },
                    responseStatus: 403
                });
                return res.status(403).json({ error: 'Refresh Token đã hết hạn' });
            }

            // Lấy lại thông tin user mới nhất từ DB để cấp Access Token mới
            const [users] = await pool.query('SELECT username, role FROM users WHERE id = ?', [payload.userId]);
            if (users.length === 0) {
                await logAudit({
                    userId: payload.userId,
                    eventType: 'TOKEN',
                    eventAction: 'REFRESH_FAILED',
                    ipAddress: getClientIp(req),
                    userAgent: getUserAgent(req),
                    requestData: { reason: 'User not found' },
                    responseStatus: 403
                });
                return res.status(403).json({ error: 'User không tồn tại' });
            }

            const newAccessToken = jwt.sign(
                { userId: payload.userId, username: users[0].username, role: users[0].role }, 
                JWT_SECRET, 
                { expiresIn: '15m' }
            );

            await logAudit({
                userId: payload.userId,
                eventType: 'TOKEN',
                eventAction: 'REFRESH_SUCCESS',
                ipAddress: getClientIp(req),
                userAgent: getUserAgent(req),
                requestData: { username: users[0].username },
                responseStatus: 200
            });

            res.status(200).json({ accessToken: newAccessToken });
        });
    } catch (error) {
        await logAudit({
            eventType: 'TOKEN',
            eventAction: 'REFRESH_ERROR',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { error: error.message },
            responseStatus: 500
        });
        res.status(500).json({ error: error.message });
    }
});

// -----------------------------------------
// API Đăng xuất (Logout)
// -----------------------------------------
app.delete('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    
    // Validate required fields
    const fieldsCheck = validateRequiredFields(req.body, ['refreshToken']);
    if (!fieldsCheck.valid) {
        await logAudit({
            eventType: 'AUTH',
            eventAction: 'LOGOUT_ERROR',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { reason: fieldsCheck.error },
            responseStatus: 400
        });
        return res.status(400).json({ error: fieldsCheck.error });
    }
    
    // Validate refresh token format
    const tokenCheck = validateRefreshToken(refreshToken);
    if (!tokenCheck.valid) {
        await logAudit({
            eventType: 'AUTH',
            eventAction: 'LOGOUT_ERROR',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { reason: tokenCheck.error },
            responseStatus: 400
        });
        return res.status(400).json({ error: tokenCheck.error });
    }
    
    const sanitizedToken = tokenCheck.sanitized;
    
    try {
        // Get user info before deleting token
        const [tokenRows] = await pool.query('SELECT user_id FROM refresh_tokens WHERE token = ?', [sanitizedToken]);
        const userId = tokenRows.length > 0 ? tokenRows[0].user_id : null;
        
        // Xóa token khỏi Database
        await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [sanitizedToken]);
        
        await logAudit({
            userId,
            eventType: 'AUTH',
            eventAction: 'LOGOUT_SUCCESS',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: {},
            responseStatus: 204
        });
        
        res.status(204).send(); // 204 No Content: Xóa thành công
    } catch (error) {
        await logAudit({
            eventType: 'AUTH',
            eventAction: 'LOGOUT_ERROR',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { error: error.message },
            responseStatus: 500
        });
        res.status(500).json({ error: error.message });
    }
});

// -----------------------------------------
// Middleware: Trạm kiểm soát Token
// -----------------------------------------
const authenticateToken = (req, res, next) => {
    // Lấy token từ header 'Authorization: Bearer <token>'
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Từ chối truy cập: Không tìm thấy Token' });
    }

    // Xác minh tính hợp lệ của Token
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Từ chối truy cập: Token không hợp lệ hoặc đã hết hạn' });
        }
        // Nếu hợp lệ, gán thông tin user vào request để các hàm sau sử dụng
        req.user = user;
        next();
    });
};

const authorizeRole = (requiredRole) => {
    return (req, res, next) => {
        // req.user lấy từ middleware authenticateToken chạy trước đó
        if (!req.user || req.user.role !== requiredRole) {
            return res.status(403).json({ 
                error: `Từ chối truy cập: Tính năng này yêu cầu quyền ${requiredRole}` 
            });
        }
        next(); // Nếu đúng role thì cho đi tiếp
    };
};

// -----------------------------------------
// 3. API Lấy thông tin cá nhân (CẦN TOKEN)
// -----------------------------------------
app.get('/me', authenticateToken, async (req, res) => {
    try {
        // req.user.userId được giải mã từ Token bởi middleware
        const [users] = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [req.user.userId]);
        
        if (users.length === 0) {
            await logAudit({
                userId: req.user.userId,
                eventType: 'API',
                eventAction: 'ME_FAILED',
                ipAddress: getClientIp(req),
                userAgent: getUserAgent(req),
                requestData: { reason: 'User not found' },
                responseStatus: 404
            });
            return res.status(404).json({ error: 'Không tìm thấy thông tin người dùng' });
        }

        await logAudit({
            userId: req.user.userId,
            eventType: 'API',
            eventAction: 'ME_SUCCESS',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { username: users[0].username },
            responseStatus: 200
        });

        res.status(200).json({ 
            message: 'Truy cập dữ liệu bảo mật thành công!', 
            data: users[0] 
        });
    } catch (error) {
        await logAudit({
            userId: req.user.userId,
            eventType: 'API',
            eventAction: 'ME_ERROR',
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            requestData: { error: error.message },
            responseStatus: 500
        });
        res.status(500).json({ error: error.message });
    }
});

const amqp = require('amqplib');

// -----------------------------------------
// 4. API Dành riêng cho Admin (CẦN TOKEN + QUYỀN ADMIN)
// -----------------------------------------
app.get('/admin/dashboard', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    await logAudit({
        userId: req.user.userId,
        eventType: 'ADMIN',
        eventAction: 'DASHBOARD_ACCESS',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        requestData: { username: req.user.username },
        responseStatus: 200
    });
    
    res.status(200).json({ 
        message: 'Xin chào sếp! Đây là khu vực quản trị tối cao.',
        adminInfo: req.user
    });
});

// -----------------------------------------
// Background Worker: Gửi sự kiện từ Outbox lên RabbitMQ
// -----------------------------------------
async function startOutboxProcessor() {
    try {
        // Kết nối tới RabbitMQ (lấy URL từ Docker compose hoặc mặc định)
        const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
        const conn = await amqp.connect(rabbitUrl);
        const channel = await conn.createChannel();
        
        const exchangeName = 'microservices_events';
        await channel.assertExchange(exchangeName, 'fanout', { durable: true });

        console.log('✅ Bưu tá Outbox đã kết nối với RabbitMQ');

        // Cứ 5 giây quét bảng outbox 1 lần
        setInterval(async () => {
            try { // <--- THÊM DÒNG NÀY
                const [events] = await pool.query('SELECT * FROM outbox_events ORDER BY created_at ASC LIMIT 10');
                
                for (const event of events) {
                    // Bắn sự kiện lên RabbitMQ
                    const message = JSON.stringify({ id: event.id, type: event.event_type, payload: event.payload });
                    channel.publish(exchangeName, '', Buffer.from(message));
                    
                    // Gửi thành công thì xóa khỏi Outbox
                    await pool.query('DELETE FROM outbox_events WHERE id = ?', [event.id]);
                    console.log(`📤 Đã gửi sự kiện: ${event.event_type}`);
                }
            } catch (err) { // <--- THÊM KHỐI NÀY
                console.error('⚠️ Lỗi khi quét Outbox (có thể DB đang khởi động):', err.message);
            }
        }, 5000);

    } catch (error) {
        console.error('Lỗi kết nối RabbitMQ, sẽ thử lại sau...', error.message);
    }
}

// Khởi động bưu tá
startOutboxProcessor();

ensureIamSchema()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`IAM Service is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to initialize IAM schema:', error);
        process.exit(1);
    });
