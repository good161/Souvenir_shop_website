const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();

// ==================== БЕЗОПАСНОСТЬ ====================

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: ['https://souvenir-shop-website.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
}));

app.use(express.json({ limit: '10mb' }));

// Блокировка доступа к служебным файлам
app.use((req, res, next) => {
    const blocked = ['/server.js', '/package.json', '/vercel.json', '/.env', '/.git'];
    if (blocked.some(p => req.path.startsWith(p))) {
        return res.status(404).send('Not found');
    }
    next();
});

app.use(express.static(path.join(__dirname)));

// ==================== ПРОВЕРКА СЕКРЕТОВ ====================

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА: JWT_SECRET не задан!');
    process.exit(1);
}

// Поддержка обоих имён переменных
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!DATABASE_URL) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА: DATABASE_URL (или POSTGRES_URL) не задан!');
    process.exit(1);
}

const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET || !CLOUDINARY_CLOUD_NAME) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА: Cloudinary ключи не заданы!');
    process.exit(1);
}

// ==================== ПОДКЛЮЧЕНИЕ К БД ====================

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ==================== RATE LIMITING ====================

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Слишком много попыток входа. Попробуйте через 15 минут' },
    standardHeaders: true,
    legacyHeaders: false
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Слишком много запросов. Попробуйте позже' },
    standardHeaders: true,
    legacyHeaders: false
});

const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { error: 'Слишком много изменений. Попробуйте позже' },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/login', loginLimiter);
app.use('/api', apiLimiter);

// ==================== ВАЛИДАЦИЯ ====================

function isString(val, min = 0, max = 1000) {
    return typeof val === 'string' && val.length >= min && val.length <= max;
}

function isInt(val, min = 0, max = Number.MAX_SAFE_INTEGER) {
    return Number.isInteger(val) && val >= min && val <= max;
}

function isValidId(val) {
    if (typeof val === 'number') return val > 0;
    if (typeof val === 'string') return val.length > 0 && val.length <= 100;
    return false;
}

// ==================== АВТОРИЗАЦИЯ ====================

function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h', algorithm: 'HS256' }
    );
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Доступ запрещён' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Доступ запрещён' });
    jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ error: 'Токен истёк. Войдите заново' });
            }
            return res.status(403).json({ error: 'Неверный токен' });
        }
        req.user = user;
        next();
    });
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }
        next();
    };
}

// ==================== АВТОРИЗАЦИЯ ====================

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    
    if (!isString(login, 1, 100) || !isString(password, 1, 100)) {
        return res.status(400).json({ error: 'Некорректные данные' });
    }
    
    try {
        const result = await pool.query('SELECT * FROM admins WHERE username = $1', [login]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Неверный логин или пароль' });
        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) return res.status(401).json({ error: 'Неверный логин или пароль' });
        const token = generateToken(user);
        res.json({ success: true, token, role: user.role });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ==================== АДМИНИСТРАТОРЫ ====================

app.get('/api/admins', authenticateToken, requireRole('Protoadmin'), async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, role FROM admins ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/admins', authenticateToken, requireRole('Protoadmin'), writeLimiter, async (req, res) => {
    const { username, password, role } = req.body;
    
    if (!isString(username, 3, 50)) {
        return res.status(400).json({ error: 'Логин должен быть от 3 до 50 символов' });
    }
    if (!isString(password, 6, 100)) {
        return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
    }
    if (!['Protoadmin', 'manager'].includes(role)) {
        return res.status(400).json({ error: 'Некорректная роль' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO admins (username, password_hash, role) VALUES ($1,$2,$3)', [username, hashedPassword, role]);
        res.json({ success: true });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Такой логин уже существует' });
        }
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/admins/:id', authenticateToken, requireRole('Protoadmin'), writeLimiter, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Некорректный ID' });
    
    try {
        await pool.query('DELETE FROM admins WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/change-password', authenticateToken, writeLimiter, async (req, res) => {
    const { password } = req.body;
    if (!isString(password, 6, 100)) {
        return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hashedPassword, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ==================== ТОВАРЫ ====================

app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(result.rows.map(p => ({
            id: p.id, name: p.name, category: p.category,
            image: p.image, images: p.images || [],
            price: p.price, description: p.description, inStock: p.in_stock,
            variants: p.variants, archived: p.archived
        })));
    } catch (err) {
        console.error('Products error:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/products', authenticateToken, writeLimiter, async (req, res) => {
    try {
        const { id, name, category, image, images, price, description, inStock, variants } = req.body;
        
        if (!isValidId(id)) return res.status(400).json({ error: 'Некорректный ID' });
        if (!isString(name, 2, 200)) return res.status(400).json({ error: 'Некорректное название' });
        if (price !== null && price !== undefined && (typeof price !== 'number' || price < 0)) {
            return res.status(400).json({ error: 'Некорректная цена' });
        }
        
        await pool.query(
            `INSERT INTO products (id, name, category, image, images, price, description, in_stock, variants)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             ON CONFLICT (id) DO UPDATE SET name=$2, category=$3, image=$4, images=$5, price=$6, description=$7, in_stock=$8, variants=$9`,
            [String(id), name, category || 'Без категории', image || '', images ? JSON.stringify(images) : '[]', price, description || '', inStock !== false, variants ? JSON.stringify(variants) : null]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Save product error:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/products/:id', authenticateToken, writeLimiter, async (req, res) => {
    if (!req.params.id || req.params.id.length > 100) return res.status(400).json({ error: 'Некорректный ID' });
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.patch('/api/products/:id', authenticateToken, writeLimiter, async (req, res) => {
    if (!req.params.id || req.params.id.length > 100) return res.status(400).json({ error: 'Некорректный ID' });
    try {
        const { archived, inStock } = req.body;
        await pool.query('UPDATE products SET archived = $1, in_stock = $2 WHERE id = $3', [archived === true, inStock !== false, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ==================== ИЗОБРАЖЕНИЯ (CLOUDINARY) ====================

app.post('/api/delete-image', authenticateToken, writeLimiter, async (req, res) => {
    const { imageUrl } = req.body;
    if (!isString(imageUrl, 1, 500)) return res.status(400).json({ error: 'Некорректный URL' });
    if (imageUrl.includes('placehold.co')) return res.json({ success: true });
    
    try {
        const parts = imageUrl.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return res.status(400).json({ error: 'Неверный URL изображения' });
        const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
        const publicId = pathAfterUpload.split('.')[0];
        if (!publicId) return res.status(400).json({ error: 'Не удалось определить public_id' });
        
        const timestamp = Math.floor(Date.now() / 1000);
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
        const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');
        
        const formData = new URLSearchParams();
        formData.append('public_id', publicId);
        formData.append('api_key', CLOUDINARY_API_KEY);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        
        await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера при удалении медиафайла' });
    }
});

// ==================== КАНАЛЫ ====================

app.get('/api/channels', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM channels ORDER BY display_order, id');
        res.json(result.rows);
    } catch (err) {
        console.error('Channels error:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/channels', authenticateToken, writeLimiter, async (req, res) => {
    const { name, url, icon } = req.body;
    if (!isString(name, 1, 100)) return res.status(400).json({ error: 'Некорректное название' });
    if (!isString(url, 1, 500)) return res.status(400).json({ error: 'Некорректный URL' });
    try {
        await pool.query('INSERT INTO channels (name, url, icon) VALUES ($1,$2,$3)', [name, url, icon || '🌐']);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.patch('/api/channels/:id', authenticateToken, writeLimiter, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Некорректный ID' });
    const { name, url, display_order } = req.body;
    try {
        if (name !== undefined) {
            if (!isString(name, 1, 100)) return res.status(400).json({ error: 'Некорректное название' });
            await pool.query('UPDATE channels SET name = $1 WHERE id = $2', [name, id]);
        }
        if (url !== undefined) {
            if (!isString(url, 1, 500)) return res.status(400).json({ error: 'Некорректный URL' });
            await pool.query('UPDATE channels SET url = $1 WHERE id = $2', [url, id]);
        }
        if (display_order !== undefined) {
            if (!isInt(display_order, 0, 9999)) return res.status(400).json({ error: 'Некорректный порядок' });
            await pool.query('UPDATE channels SET display_order = $1 WHERE id = $2', [display_order, id]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/channels/:id', authenticateToken, writeLimiter, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Некорректный ID' });
    try {
        await pool.query('DELETE FROM channels WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ==================== КАРТОЧКИ ====================

app.get('/api/cards', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cards ORDER BY display_order, id');
        res.json(result.rows);
    } catch (err) {
        console.error('Cards error:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/cards', authenticateToken, writeLimiter, async (req, res) => {
    const { id, name, description, url, display_order } = req.body;
    if (!isValidId(id)) return res.status(400).json({ error: 'Некорректный ID' });
    if (!isString(name, 1, 200)) return res.status(400).json({ error: 'Некорректное название' });
    try {
        await pool.query(
            'INSERT INTO cards (id, name, description, url, display_order) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = $2, description = $3, url = $4, display_order = $5',
            [id, name, description || '', url || '', display_order || 0]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.patch('/api/cards/:id', authenticateToken, writeLimiter, async (req, res) => {
    if (!req.params.id || req.params.id.length > 100) return res.status(400).json({ error: 'Некорректный ID' });
    const { name, description, url } = req.body;
    try {
        if (name !== undefined) {
            if (!isString(name, 1, 200)) return res.status(400).json({ error: 'Некорректное название' });
            await pool.query('UPDATE cards SET name = $1 WHERE id = $2', [name, req.params.id]);
        }
        if (description !== undefined) {
            if (!isString(description, 0, 1000)) return res.status(400).json({ error: 'Некорректное описание' });
            await pool.query('UPDATE cards SET description = $1 WHERE id = $2', [description, req.params.id]);
        }
        if (url !== undefined) {
            if (!isString(url, 0, 500)) return res.status(400).json({ error: 'Некорректный URL' });
            await pool.query('UPDATE cards SET url = $1 WHERE id = $2', [url, req.params.id]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/cards/:id', authenticateToken, writeLimiter, async (req, res) => {
    const protectedCards = ['merch', 'official-channels', 'it-services', 'bots'];
    if (protectedCards.includes(req.params.id)) {
        return res.status(403).json({ error: 'Эту карточку удалить нельзя' });
    }
    try {
        await pool.query('DELETE FROM cards WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ==================== ССЫЛКИ КАРТОЧЕК ====================

app.get('/api/card-links/:cardId', async (req, res) => {
    if (!req.params.cardId || req.params.cardId.length > 100) return res.status(400).json({ error: 'Некорректный cardId' });
    try {
        const result = await pool.query('SELECT * FROM card_links WHERE card_id = $1 ORDER BY display_order, id', [req.params.cardId]);
        res.json(result.rows);
    } catch (err) {
        console.error('CardLinks error:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/card-links', authenticateToken, writeLimiter, async (req, res) => {
    const { card_id, name, url, description } = req.body;
    if (!isValidId(card_id)) return res.status(400).json({ error: 'Некорректный card_id' });
    if (!isString(name, 1, 200)) return res.status(400).json({ error: 'Некорректное название' });
    if (!isString(url, 1, 500)) return res.status(400).json({ error: 'Некорректный URL' });
    try {
        await pool.query('INSERT INTO card_links (card_id, name, url, description) VALUES ($1,$2,$3,$4)', [card_id, name, url, description || '']);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.patch('/api/card-links/:id', authenticateToken, writeLimiter, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Некорректный ID' });
    const { name, url, description, display_order } = req.body;
    try {
        if (name !== undefined) {
            if (!isString(name, 1, 200)) return res.status(400).json({ error: 'Некорректное название' });
            await pool.query('UPDATE card_links SET name = $1 WHERE id = $2', [name, id]);
        }
        if (url !== undefined) {
            if (!isString(url, 1, 500)) return res.status(400).json({ error: 'Некорректный URL' });
            await pool.query('UPDATE card_links SET url = $1 WHERE id = $2', [url, id]);
        }
        if (description !== undefined) {
            if (!isString(description, 0, 1000)) return res.status(400).json({ error: 'Некорректное описание' });
            await pool.query('UPDATE card_links SET description = $1 WHERE id = $2', [description, id]);
        }
        if (display_order !== undefined) {
            if (!isInt(display_order, 0, 9999)) return res.status(400).json({ error: 'Некорректный порядок' });
            await pool.query('UPDATE card_links SET display_order = $1 WHERE id = $2', [display_order, id]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/card-links/:id', authenticateToken, writeLimiter, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Некорректный ID' });
    try {
        await pool.query('DELETE FROM card_links WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = app;
