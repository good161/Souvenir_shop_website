require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();

app.use(cors({
    origin: ['https://souvenir-shop-website.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const JWT_SECRET = process.env.JWT_SECRET || 'chsu-merch-jwt-secret-2026';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.atzspalpmoijomeccjzw:P0OqqcN0gyc8mBz6@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h', algorithm: 'HS256' }
    );
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Доступ запрещён' });
    jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, user) => {
        if (err) return res.status(403).json({ error: 'Неверный или просроченный токен' });
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

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    if (!login || !password) return res.status(400).json({ error: 'Логин и пароль обязательны' });
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

app.get('/api/admins', authenticateToken, requireRole('Protoadmin'), async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, role FROM admins ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/admins', authenticateToken, requireRole('Protoadmin'), async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) return res.status(400).json({ error: 'Все поля обязательны' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO admins (username, password_hash, role) VALUES ($1,$2,$3)', [username, hashedPassword, role]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/admins/:id', authenticateToken, requireRole('Protoadmin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM admins WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

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
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/products', authenticateToken, async (req, res) => {
    try {
        const { id, name, category, image, images, price, description, inStock, variants } = req.body;
        await pool.query(
            `INSERT INTO products (id, name, category, image, images, price, description, in_stock, variants)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             ON CONFLICT (id) DO UPDATE SET name=$2, category=$3, image=$4, images=$5, price=$6, description=$7, in_stock=$8, variants=$9`,
            [String(id), name, category, image, images ? JSON.stringify(images) : '[]', price, description, inStock, variants ? JSON.stringify(variants) : null]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.patch('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        const { archived, inStock } = req.body;
        await pool.query('UPDATE products SET archived = $1, in_stock = $2 WHERE id = $3', [archived, inStock, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/delete-image', authenticateToken, async (req, res) => {
    const { imageUrl } = req.body;
    if (!imageUrl || imageUrl.includes('placehold.co')) return res.json({ success: true });
    try {
        const parts = imageUrl.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return res.status(400).json({ error: 'Неверный URL изображения' });
        const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
        const publicId = pathAfterUpload.split('.')[0];
        if (!publicId) return res.status(400).json({ error: 'Не удалось определить public_id' });
        
        const timestamp = Math.floor(Date.now() / 1000);
        const apiSecret = process.env.CLOUDINARY_API_SECRET || 'wXSugPZb_b08BH2rGqq_KoOPA1g';
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');
        
        const formData = new URLSearchParams();
        formData.append('public_id', publicId);
        formData.append('api_key', process.env.CLOUDINARY_API_KEY || '377457394998153');
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        
        await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME || 'sd0mazc2'}/image/destroy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера при удалении медиафайла' });
    }
});

app.get('/api/channels', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM channels ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/channels', authenticateToken, async (req, res) => {
    const { name, url, icon } = req.body;
    try {
        await pool.query('INSERT INTO channels (name, url, icon) VALUES ($1,$2,$3)', [name, url, icon || '🌐']);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/channels/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM channels WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = app;
