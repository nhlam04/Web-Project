const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Tạo kết nối (Pool) tới MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASS || 'password123',
    database: process.env.DB_NAME || 'iam',
    waitForConnections: true,
    connectionLimit: 10
});

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

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Secret key để ký JWT (Trong thực tế sẽ để ở file .env)
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-microservices';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

// -----------------------------------------
// 1. API Đăng ký (Nâng cấp Outbox Pattern)
// -----------------------------------------
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    // Mở một kết nối riêng để chạy Transaction
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction(); // Bắt đầu giao dịch

        // 1. Kiểm tra user trùng
        const [existing] = await conn.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            await conn.rollback();
            return res.status(400).json({ error: 'Tài khoản đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        // 2. Lưu user vào DB
        await conn.query(
            'INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)', 
            [userId, username, hashedPassword]
        );

        // 3. Tạo sự kiện và lưu vào bảng Outbox
        const eventId = uuidv4();
        const payload = JSON.stringify({ userId, username, action: 'UserCreated' });
        
        await conn.query(
            'INSERT INTO outbox_events (id, event_type, payload) VALUES (?, ?, ?)',
            [eventId, 'UserCreated', payload]
        );

        await conn.commit(); // Chốt giao dịch thành công!
        res.status(201).json({ message: 'Đăng ký thành công và đã ghi nhận sự kiện!', userId });
    } catch (error) {
        await conn.rollback(); // Có lỗi xảy ra, hủy bỏ mọi thay đổi
        res.status(500).json({ error: error.message });
    } finally {
        conn.release(); // Trả kết nối lại cho Pool
    }
});

// -----------------------------------------
// 2. API Đăng nhập (Login)
// -----------------------------------------
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Tìm user trong DB
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
        }

        const user = users[0];

        // So sánh mật khẩu
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
        }

        // 1. Tạo Access Token (Ngắn hạn - 15 phút) dùng để đi qua các trạm gác API
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
    if (!refreshToken) return res.status(401).json({ error: 'Không tìm thấy Refresh Token' });

    try {
        // Kiểm tra token có nằm trong Database không (đề phòng đã bị thu hồi)
        const [rows] = await pool.query('SELECT * FROM refresh_tokens WHERE token = ?', [refreshToken]);
        if (rows.length === 0) return res.status(403).json({ error: 'Refresh Token không hợp lệ hoặc đã bị thu hồi' });

        // Xác minh Refresh Token
        jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, payload) => {
            if (err) return res.status(403).json({ error: 'Refresh Token đã hết hạn' });

            // Lấy lại thông tin user mới nhất từ DB để cấp Access Token mới
            const [users] = await pool.query('SELECT username, role FROM users WHERE id = ?', [payload.userId]);
            if (users.length === 0) return res.status(403).json({ error: 'User không tồn tại' });

            const newAccessToken = jwt.sign(
                { userId: payload.userId, username: users[0].username, role: users[0].role }, 
                JWT_SECRET, 
                { expiresIn: '15m' }
            );

            res.status(200).json({ accessToken: newAccessToken });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// -----------------------------------------
// API Đăng xuất (Logout)
// -----------------------------------------
app.delete('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    try {
        // Xóa token khỏi Database
        await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
        res.status(204).send(); // 204 No Content: Xóa thành công
    } catch (error) {
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
        const [users] = await pool.query('SELECT id, username FROM users WHERE id = ?', [req.user.userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy thông tin người dùng' });
        }

        res.status(200).json({ 
            message: 'Truy cập dữ liệu bảo mật thành công!', 
            data: users[0] 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const amqp = require('amqplib');

// -----------------------------------------
// 4. API Dành riêng cho Admin (CẦN TOKEN + QUYỀN ADMIN)
// -----------------------------------------
app.get('/admin/dashboard', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
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

app.listen(PORT, () => {
    console.log(`IAM Service is running on port ${PORT}`);
});