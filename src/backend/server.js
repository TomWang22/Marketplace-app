const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cluster = require('cluster');
const os = require('os');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');

const numCPUs = os.cpus().length;
const port = 3000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'marketplace',
    port: 5432,
});

const redisClient = new Redis({
    host: '127.0.0.1',
    port: 6379,
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });
} else {
    const app = express();

    app.use(bodyParser.json());

    // Configure CORS to allow requests from your frontend's origin
    app.use(cors({
        origin: 'http://127.0.0.1:5500'
    }));

    // Configure session management with Redis
    app.use(session({
        store: new RedisStore({ client: redisClient }),
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false } // Set to true if using HTTPS
    }));

    // Serve static files from the frontend directory
    app.use(express.static(path.join(__dirname, '../frontend')));

    // User registration endpoint
    app.post('/api/register', async (req, res) => {
        const { username, password, role } = req.body;
        if (!username || !password || !role) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await pool.query('INSERT INTO users (username, password, role, balance) VALUES ($1, $2, $3, $4) RETURNING *', [username, hashedPassword, role, 50000]);
            res.json({ success: true, user: result.rows[0] });
        } catch (error) {
            if (error.code === '23505') {
                res.status(400).json({ success: false, message: 'Username already exists' });
            } else {
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        }
    });

    // User login endpoint
    app.post('/api/login', async (req, res) => {
        const { username, password } = req.body;

        try {
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            const user = result.rows[0];

            if (user && await bcrypt.compare(password, user.password)) {
                const token = generateToken(user.id);
                res.json({ success: true, userId: user.id, role: user.role, token });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Fetch products endpoint
    app.get('/api/products', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM products');
            res.json({ success: true, products: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Fetch shopping cart items
    app.get('/api/cart', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM shopping_cart');
            res.json({ success: true, items: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Place order endpoint
    app.post('/api/place-order', async (req, res) => {
        const { userId, cartItems } = req.body;

        try {
            const totalCost = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
            const balanceResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
            const userBalance = balanceResult.rows[0].balance;

            if (userBalance < totalCost) {
                return res.status(400).json({ success: false, message: 'Insufficient balance to complete the purchase.' });
            }

            await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [totalCost, userId]);
            const orderResult = await pool.query('INSERT INTO orders (user_id, total_cost, order_date) VALUES ($1, $2, NOW()) RETURNING id', [userId, totalCost]);
            const orderId = orderResult.rows[0].id;

            for (const item of cartItems) {
                await pool.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)', [orderId, item.productId, item.quantity, item.price]);
            }

            res.json({ success: true, message: 'Order placed successfully.' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    });

    // Return merchandise endpoint with 30-day limit
    app.post('/api/return-merchandise', async (req, res) => {
        const { userId, productId, quantity } = req.body;

        try {
            const orderItemResult = await pool.query('SELECT oi.price, o.order_date FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.product_id = $1 AND o.user_id = $2 ORDER BY o.order_date DESC LIMIT 1', [productId, userId]);
            const orderItem = orderItemResult.rows[0];

            if (!orderItem) {
                return res.status(400).json({ success: false, message: 'No purchase record found for the specified product.' });
            }

            const orderDate = new Date(orderItem.order_date);
            const currentDate = new Date();
            const daysDiff = (currentDate - orderDate) / (1000 * 60 * 60 * 24);

            if (daysDiff > 30) {
                return res.status(400).json({ success: false, message: 'The return period for this product has expired.' });
            }

            const refundAmount = orderItem.price * quantity;
            await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [refundAmount, userId]);
            await pool.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [quantity, productId]);

            res.json({ success: true, message: 'Merchandise returned and refunded successfully.' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Receive supplies endpoint
    app.post('/api/receive-supplies', async (req, res) => {
        const { productId, quantity } = req.body;

        try {
            const result = await pool.query('UPDATE products SET stock = stock + $1 WHERE id = $2 RETURNING *', [quantity, productId]);
            res.json({ success: true, message: 'Supplies received successfully', product: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Endpoint to add a new product
    app.post('/api/products', async (req, res) => {
        const { name, description, price, stock } = req.body;
        try {
            const result = await pool.query(
                'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, description, price, stock]
            );
            res.json({ success: true, product: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Update item quantity
    app.put('/api/cart/:id', async (req, res) => {
        const itemId = req.params.id;
        const { quantity } = req.body;

        try {
            await pool.query('UPDATE shopping_cart SET quantity = $1 WHERE id = $2', [quantity, itemId]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Remove item from cart
    app.delete('/api/cart/:id', async (req, res) => {
        const itemId = req.params.id;

        try {
            await pool.query('DELETE FROM shopping_cart WHERE id = $1', [itemId]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Add funds to user balance
    app.post('/api/add-funds', async (req, res) => {
        const { userId, amount } = req.body;

        if (amount <= 0) {
            return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
        }

        try {
            await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, userId]);
            res.json({ success: true, message: 'Funds added successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Serve login.html as the default page
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/login.html'));
    });

    // Serve merchant.html for merchants
    app.get('/merchant.html', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/merchant.html'));
    });

    // Serve other HTML files as needed
    app.get('/:page', (req, res) => {
        const page = req.params.page;
        const allowedPages = ['merchant.html', 'supplier.html', 'shopper.html'];
        if (allowedPages.includes(page)) {
            res.sendFile(path.join(__dirname, `../frontend/${page}`));
        } else {
            res.status(404).send('Page not found');
        }
    });

    // Start the server
    app.listen(port, () => {
        console.log(`Worker ${process.pid} is running on http://localhost:${port}`);
    });

    // Function to generate a token (You need to implement this based on your auth strategy)
    function generateToken(userId) {
        const secretKey = 'your_secret_key';
        return jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
    }
}
