const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
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
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.tomujzfwckslaylivjiq:ujuoiYHU784E87H-0IknuojDUO@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

const SOUVENIRS_DIR = path.join(__dirname, 'images', 'Souvenirs');
if (!fs.existsSync(SOUVENIRS_DIR)) {
    fs.mkdirSync(SOUVENIRS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, SOUVENIRS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.webp';
        const uniqueName = `souvenir-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Недопустимый формат файла'));
    }
});

function generateToken(user) {
    const permissions = user.role === 'Protoadmin'
        ? { main: true, merch: true }
        : (user.permissions || { main: true, merch: true });
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role, permissions },
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

function requirePermission(perm) {
    return (req, res, next) => {
        if (req.user.role === 'Protoadmin') return next();
        const perms = req.user.permissions || {};
        if (!perms[perm]) {
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
        const permissions = user.role === 'Protoadmin'
            ? { main: true, merch: true }
            : (user.permissions || { main: true, merch: true });
        res.json({ success: true, token, role: user.role, permissions });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/admins', authenticateToken, requireRole('Protoadmin'), async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, full_name, role, permissions FROM admins ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/admins', authenticateToken, requireRole('Protoadmin'), async (req, res) => {
    const { username, password, role, full_name, permissions } = req.body;
    if (!username || !password || !role) return res.status(400).json({ error: 'Все поля обязательны' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const perms = permissions || { main: true, merch: true };
        await pool.query(
            'INSERT INTO admins (username, password_hash, role, full_name, permissions) VALUES ($1,$2,$3,$4,$5)',
            [username, hashedPassword, role, full_name || '', JSON.stringify(perms)]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.patch('/api/admins/:id', authenticateToken, requireRole('Protoadmin'), async (req, res) => {
    const { username, full_name, role, password, permissions } = req.body;
    try {
        if (username) await pool.query('UPDATE admins SET username = $1 WHERE id = $2', [username, req.params.id]);
        if (full_name !== undefined) await pool.query('UPDATE admins SET full_name = $1 WHERE id = $2', [full_name, req.params.id]);
        if (role) await pool.query('UPDATE admins SET role = $1 WHERE id = $2', [role, req.params.id]);
        if (permissions) await pool.query('UPDATE admins SET permissions = $1 WHERE id = $2', [JSON.stringify(permissions), req.params.id]);
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hashedPassword, req.params.id]);
        }
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

app.post('/api/upload-image', authenticateToken, requirePermission('merch'), upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
    res.json({ success: true, url: `images/Souvenirs/${req.file.filename}` });
});

app.post('/api/delete-image', authenticateToken, requirePermission('merch'), (req, res) => {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'URL не указан' });

    if (imageUrl.includes('placehold.co') || imageUrl.startsWith('http')) {
        return res.json({ success: true, skipped: true });
    }

    try {
        const decoded = decodeURIComponent(imageUrl);
        const safeName = path.basename(decoded);
        const filePath = path.join(SOUVENIRS_DIR, safeName);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return res.json({ success: true });
        }
        return res.json({ success: true, notFound: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления файла' });
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

app.post('/api/products', authenticateToken, requirePermission('merch'), async (req, res) => {
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

app.delete('/api/products/:id', authenticateToken, requirePermission('merch'), async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.patch('/api/products/:id', authenticateToken, requirePermission('merch'), async (req, res) => {
    try {
        const { archived, inStock } = req.body;
        await pool.query('UPDATE products SET archived = $1, in_stock = $2 WHERE id = $3', [archived, inStock, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/channels', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM channels ORDER BY display_order, id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/channels', authenticateToken, requirePermission('main'), async (req, res) => {
    const { name, url, icon } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Название и URL обязательны' });
    try {
        await pool.query('INSERT INTO channels (name, url, icon) VALUES ($1,$2,$3)', [name, url, icon || '🌐']);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.patch('/api/channels/:id', authenticateToken, requirePermission('main'), async (req, res) => {
    const { name, url, display_order } = req.body;
    try {
        if (name) await pool.query('UPDATE channels SET name = $1 WHERE id = $2', [name, req.params.id]);
        if (url) await pool.query('UPDATE channels SET url = $1 WHERE id = $2', [url, req.params.id]);
        if (display_order !== undefined) await pool.query('UPDATE channels SET display_order = $1 WHERE id = $2', [display_order, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/channels/:id', authenticateToken, requirePermission('main'), async (req, res) => {
    try {
        await pool.query('DELETE FROM channels WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/cards', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cards ORDER BY display_order, id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/cards', authenticateToken, requirePermission('main'), async (req, res) => {
    const { id, name, description, url, display_order } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'ID и название обязательны' });
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

app.patch('/api/cards/:id', authenticateToken, requirePermission('main'), async (req, res) => {
    const { name, description, url } = req.body;
    try {
        if (name) await pool.query('UPDATE cards SET name = $1 WHERE id = $2', [name, req.params.id]);
        if (description !== undefined) await pool.query('UPDATE cards SET description = $1 WHERE id = $2', [description, req.params.id]);
        if (url !== undefined) await pool.query('UPDATE cards SET url = $1 WHERE id = $2', [url, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/cards/:id', authenticateToken, requirePermission('main'), async (req, res) => {
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

app.get('/api/card-links/:cardId', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM card_links WHERE card_id = $1 ORDER BY display_order, id', [req.params.cardId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/card-links', authenticateToken, requirePermission('main'), async (req, res) => {
    const { card_id, name, url, description } = req.body;
    if (!card_id || !name || !url) return res.status(400).json({ error: 'Все поля обязательны' });
    try {
        await pool.query('INSERT INTO card_links (card_id, name, url, description) VALUES ($1,$2,$3,$4)', [card_id, name, url, description || '']);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.patch('/api/card-links/:id', authenticateToken, requirePermission('main'), async (req, res) => {
    const { name, url, description, display_order } = req.body;
    try {
        if (name) await pool.query('UPDATE card_links SET name = $1 WHERE id = $2', [name, req.params.id]);
        if (url) await pool.query('UPDATE card_links SET url = $1 WHERE id = $2', [url, req.params.id]);
        if (description !== undefined) await pool.query('UPDATE card_links SET description = $1 WHERE id = $2', [description, req.params.id]);
        if (display_order !== undefined) await pool.query('UPDATE card_links SET display_order = $1 WHERE id = $2', [display_order, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/card-links/:id', authenticateToken, requirePermission('main'), async (req, res) => {
    try {
        await pool.query('DELETE FROM card_links WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = app;
