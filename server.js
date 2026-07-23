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
    host: process.env.DB_HOST || 'fqa33o7ett6cja9klkfs7j9s7g.us-east-1.xata.tech',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'xata',
    password: process.env.DB_PASSWORD || 'I6fhRVZp3kNl75JmnJzDSnuRe2BIBi9WpvOe6YyPYRMUXmbpPLOH6eoG98lmOMEM',
    database: process.env.DB_NAME || 'xata',
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

app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(result.rows.map(p => ({
            id: p.id, name: p.name, category: p.category, image: p.image,
            price: p.price, description: p.description, inStock: p.in_stock,
            variants: p.variants, archived: p.archived
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { id, name, category, image, price, description, inStock, variants } = req.body;
        await pool.query(
            `INSERT INTO products (id, name, category, image, price, description, in_stock, variants) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO UPDATE SET name = $2, category = $3, image = $4, price = $5, description = $6, in_stock = $7, variants = $8`,
            [String(id), name, category, image, price, description, inStock, JSON.stringify(variants)]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/products/:id', async (req, res) => {
    try {
        const { archived, inStock } = req.body;
        await pool.query('UPDATE products SET archived = $1, in_stock = $2 WHERE id = $3', [archived, inStock, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
