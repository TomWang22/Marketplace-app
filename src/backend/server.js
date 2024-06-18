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

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });
} else {
    const app = express();

    app.use(bodyParser.json());

    app.use(cors({
        origin: 'http://127.0.0.1:5500'
    }));

    app.use(session({
        store: new RedisStore({ client: redisClient }),
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }
    }));

    app.use(express.static(path.join(__dirname, '../frontend')));

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

    app.get('/api/cart', async (req, res) => {
        const userId = req.query.userId;
        try {
            const result = await pool.query('SELECT id, user_id, product_id, product, SUM(quantity) as quantity, price FROM shopping_cart WHERE user_id = $1 GROUP BY id, user_id, product_id, product, price', [userId]);
            res.json({ success: true, items: result.rows });
        } catch (error) {
            console.error('Error fetching cart items:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
    

    app.post('/api/place-order', async (req, res) => {
        const { userId, cartItems } = req.body;
    
        // Log the received cart items for debugging
        console.log('Received cart items:', cartItems);
    
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
                const { product_id, quantity, price } = item;
    
                // Log the current item for debugging
                console.log('Processing item:', item);
    
                if (!product_id) {
                    throw new Error(`Product ID is missing for one of the items.`);
                }
    
                await pool.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)', [orderId, product_id, quantity, price]);
    
                // Commenting out the seller_id logic for now
                /*
                const sellerResult = await pool.query('SELECT seller_id FROM products WHERE id = $1', [product_id]);
                const sellerId = sellerResult.rows[0].seller_id;
                await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [price * quantity, sellerId]);
                */
    
                await pool.query('INSERT INTO purchase_history (user_id, product_id, quantity, price, purchase_date) VALUES ($1, $2, $3, $4, NOW())', [userId, product_id, quantity, price]);
            }
    
            res.json({ success: true, message: 'Order placed successfully.' });
        } catch (error) {
            console.error('Error placing order:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    });
    
    
    
    
    
    

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

    app.post('/api/receive-supplies', async (req, res) => {
        const { merchantId, productId, quantity } = req.body;

        try {
            const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
            const product = productResult.rows[0];

            if (!product) {
                return res.status(400).json({ success: false, message: 'Product not found.' });
            }

            const totalCost = product.price * quantity;
            await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [totalCost, merchantId]);
            await pool.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [quantity, productId]);

            const receivedSupplyResult = await pool.query('SELECT * FROM received_supplies WHERE name = $1', [product.name]);
            if (receivedSupplyResult.rows.length > 0) {
                await pool.query('UPDATE received_supplies SET stock = stock + $1 WHERE name = $2', [quantity, product.name]);
            } else {
                await pool.query('INSERT INTO received_supplies (name, description, price, stock, image_url) VALUES ($1, $2, $3, $4, $5)', [product.name, product.description, product.price, quantity, product.image_url]);
            }

            res.json({ success: true, message: 'Supplies received successfully.' });
        } catch (error) {
            console.error('Error receiving supplies:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    app.get('/api/products', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM products;');
            res.json({ success: true, products: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    app.post('/api/products', async (req, res) => {
        const { name, description, price, stock, image_url } = req.body;
        try {
            const result = await pool.query(
                'INSERT INTO products (name, description, price, stock, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [name, description, price, stock, image_url]
            );
            res.json({ success: true, product: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    app.get('/api/supplies', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM supplies;');
            res.json({ success: true, supplies: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    app.post('/api/supplies', async (req, res) => {
        const { name, description, price, cost, stock, image_url } = req.body;
        try {
            const result = await pool.query(
                'INSERT INTO supplies (name, description, price, cost, stock, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [name, description, price, cost, stock, image_url]
            );
            res.json({ success: true, supply: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    app.get('/api/account-info', async (req, res) => {
        const userId = req.query.userId;
        try {
            const result = await pool.query('SELECT username, balance FROM users WHERE id = $1', [userId]);
            res.json({ success: true, account: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    app.get('/api/purchase-history', async (req, res) => {
        const userId = req.query.userId;
        try {
            const result = await pool.query('SELECT * FROM purchase_history WHERE user_id = $1', [userId]);
            res.json({ success: true, history: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    app.post('/api/cart', async (req, res) => {
        const { userId, productId, quantity } = req.body;
    
        if (!userId || !productId || !quantity) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }
    
        try {
            const productResult = await pool.query('SELECT name, price FROM products WHERE id = $1', [productId]);
            if (productResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
    
            const product = productResult.rows[0];
            const result = await pool.query(
                'INSERT INTO shopping_cart (user_id, product_id, product, quantity, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [userId, productId, product.name, quantity, product.price]
            );
            res.json({ success: true, item: result.rows[0] });
        } catch (error) {
            console.error('Error adding item to cart:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
    

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

    app.delete('/api/cart/:id', async (req, res) => {
        const itemId = req.params.id;

        try {
            await pool.query('DELETE FROM shopping_cart WHERE id = $1', [itemId]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

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

    app.get('/api/received-supplies', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM received_supplies');
            res.json({ success: true, supplies: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    app.use(express.static(path.join(__dirname, '../frontend')));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/login.html'));
    });

    app.get('/:page', (req, res) => {
        const page = req.params.page;
        const allowedPages = [
            'login.html', 'merchant.html', 'supplier.html', 'shopper.html', 'dashboard.html',
            'marketplace.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html', 'shopping-cart.html',
            'product-details.html'
        ];
        if (allowedPages.includes(page)) {
            res.sendFile(path.join(__dirname, `../frontend/${page}`));
        } else {
            res.status(404).send('Page not found');
        }
    });

    app.get('/api/users/:userId', async (req, res) => {
        const userId = req.params.userId;

        try {
            const userResult = await pool.query('SELECT username, balance FROM users WHERE id = $1', [userId]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const user = userResult.rows[0];

            const shoppingHistoryResult = await pool.query('SELECT id, product_id, quantity, purchase_date FROM purchase_history WHERE user_id = $1', [userId]);
            const searchHistoryResult = await pool.query('SELECT id, search_query, search_date FROM search_history WHERE user_id = $1', [userId]);

            const userData = {
                username: user.username,
                balance: user.balance,
                shoppingHistory: shoppingHistoryResult.rows,
                searchHistory: searchHistoryResult.rows
            };

            res.json({ success: true, user: userData });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    app.post('/api/search-history', async (req, res) => {
        const { userId, searchQuery } = req.body;
        try {
            await pool.query(
                'INSERT INTO search_history (user_id, search_query, search_date) VALUES ($1, $2, NOW())',
                [userId, searchQuery]
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    app.listen(port, () => {
        console.log(`Worker ${process.pid} is running on http://localhost:${port}`);
    });

    function generateToken(userId) {
        const secretKey = 'your_secret_key';
        return jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
    }
}
