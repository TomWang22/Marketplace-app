const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const port = 5000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'marketplace',
    port: 5432,
});

app.use(bodyParser.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, 'src/frontend')));

// User registration
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *', [username, hashedPassword, email]);
    res.json(result.rows[0]);
});

// User login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (user.rows.length > 0 && await bcrypt.compare(password, user.rows[0].password)) {
        const token = jwt.sign({ id: user.rows[0].id }, 'your_secret_key');
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Get products
app.get('/api/products', async (req, res) => {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
});

// Add product to cart
app.post('/api/cart', async (req, res) => {
    const { userId, productId, quantity } = req.body;
    const cart = await pool.query('INSERT INTO shopping_cart (user_id) VALUES ($1) RETURNING *', [userId]);
    await pool.query('INSERT INTO shopping_cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)', [cart.rows[0].id, productId, quantity]);
    res.json(cart.rows[0]);
});

// Purchase history
app.get('/api/purchase-history/:userId', async (req, res) => {
    const { userId } = req.params;
    const result = await pool.query('SELECT * FROM purchase_history WHERE user_id = $1', [userId]);
    res.json(result.rows);
});

// Default route for SPA (Single Page Application)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/frontend', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
