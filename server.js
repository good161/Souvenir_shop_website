const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const pool = new Pool({
    connectionString: (process.env.DATABASE_URL || '').replace('?sslmode=require', ''),
    ssl: { rejectUnauthorized: false }
});

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        const hash = hashPassword(password);
        const result = await pool.query('SELECT * FROM admins WHERE username = $1 AND password_hash = $2', [login, hash]);
        if (result.rows.length > 0) {
            res.json({ success: true, role: result.rows[0].role });
        } else {
            res.status(401).json({ error: 'Неверный логин или пароль' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admins', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, role FROM admins ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admins', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hash = hashPassword(password);
        await pool.query('INSERT INTO admins (username, password_hash, role) VALUES ($1,$2,$3)', [username, hash, role]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admins/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM admins WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

app.patch('/api/products/:id', async (req, res) => {
    const { archived, inStock } = req.body;
    await pool.query('UPDATE products SET archived = $1, in_stock = $2 WHERE id = $3', [archived, inStock, req.params.id]);
    res.json({ success: true });
});

app.post('/api/delete-image', async (req, res) => {
    const { imageUrl } = req.body;
    if (!imageUrl || imageUrl.includes('placehold.co')) return res.json({ success: true });
    
    try {
        const parts = imageUrl.split('/');
        const filename = parts[parts.length - 1].split('.')[0];
        const publicId = filename;
        
        const timestamp = Math.floor(Date.now() / 1000);
        const apiSecret = 'wXSugPZb_b08BH2rGqq_KoOPA1g';
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');
        
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
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
