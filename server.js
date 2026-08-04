const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const JWT_SECRET = process.env.JWT_SECRET || 'chsu-merch-secret-key-2026';

const pool = new Pool({
    host: 'aws-0-us-east-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.atzspalpmoijomeccjzw',
    password: 'P0OqqcN0gyc8mBz6',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

function generateToken(user) {
    return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Требуется авторизация' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Токен недействителен' });
        req.user = user;
        next();
    });
}

function requireRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }
        next();
    };
}

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM admins WHERE username = $1', [login]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }
        
        const admin = result.rows[0];
        const valid = await bcrypt.compare(password, admin.password_hash);
        
        if (!valid) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }
        
        const token = generateToken(admin);
        res.json({ success: true, token, role: admin.role });
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
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        await pool.query('INSERT INTO admins (username, password_hash, role) VALUES ($1,$2,$3)', [username, hash, role]);
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

app.post('/api/change-password', authenticateToken, async (req, res) => {
    const { password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        await pool.query("UPDATE admins SET password_hash = $1 WHERE role = 'Protoadmin'", [hash]);
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
            image: p.image,
            images: p.images || [],
            price: p.price, description: p.description, inStock: p.in_stock,
            variants: p.variants,
            archived: p.archived
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
    const { archived, inStock } = req.body;
    try {
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
        const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
        const publicId = pathAfterUpload.split('.')[0];

        const timestamp = Math.floor(Date.now() / 1000);
        const apiSecret = 'wXSugPZb_b08BH2rGqq_KoOPA1g';
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        const signature = require('crypto').createHash('sha1').update(stringToSign).digest('hex');

        const formData = new URLSearchParams();
        formData.append('public_id', publicId);
        formData.append('api_key', '377457394998153');
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);

        await fetch('https://api.cloudinary.com/v1_1/sd0mazc2/image/destroy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = app;
