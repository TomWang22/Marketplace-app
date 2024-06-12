// Required libraries and modules
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

// Determine the number of CPUs available
const numCPUs = os.cpus().length;
const port = 3000;

// PostgreSQL database connection configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'marketplace',
    port: 5432,
});

// Redis client configuration
const redisClient = new Redis({
    host: '127.0.0.1',
    port: 6379,
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

// Clustering to utilize all available CPU cores
if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });
} else {
    const app = express();

    app.use(bodyParser.json()); // Middleware to parse JSON requests

    // CORS configuration to allow requests from your frontend's origin
    app.use(cors({
        origin: 'http://127.0.0.1:5500'
    }));

    // Session management configuration with Redis
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
        console.log('Registration request received:', { username, role });

        if (!username || !password || !role) {
            console.log('Missing fields');
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        try {
            console.log('Hashing password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log('Password hashed:', hashedPassword);

            console.log('Inserting user into database...');
            const result = await pool.query('INSERT INTO users (username, password, role, balance) VALUES ($1, $2, $3, $4) RETURNING *', [username, hashedPassword, role, 50000]);
            console.log('User registered:', result.rows[0]);

            res.json({ success: true, user: result.rows[0] });
        } catch (error) {
            console.error('Error registering user:', error);

            if (error.code === '23505') {
                // Duplicate username
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
                const token = generateToken(user.id); // Implement your token generation logic
                const response = { success: true, userId: user.id, role: user.role, token };
                console.log('Login successful:', response);
                res.json(response);
            } else {
                const response = { success: false, message: 'Invalid credentials' };
                console.log('Login failed:', response);
                res.status(401).json(response);
            }
        } catch (error) {
            console.error('Error during login:', error);
            const response = { success: false, message: 'Internal server error' };
            res.status(500).json(response);
        }
    });

    // Fetch shopping cart items endpoint
    app.get('/api/cart', async (req, res) => {
        const userId = req.query.userId;
        try {
            const result = await pool.query('SELECT * FROM shopping_cart WHERE user_id = $1', [userId]);
            res.json({ success: true, items: result.rows });
        } catch (error) {
            console.error('Error fetching cart items:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Place order endpoint
    app.post('/api/place-order', async (req, res) => {
        const { userId, cartItems } = req.body;

        try {
            // Calculate total cost of the items in the cart
            const totalCost = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

            // Get the user's current balance
            const balanceResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
            const userBalance = balanceResult.rows[0].balance;

            if (userBalance < totalCost) {
                return res.status(400).json({ success: false, message: 'Insufficient balance to complete the purchase.' });
            }

            // Deduct the total cost from the user's balance
            await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [totalCost, userId]);

            // Insert an order record (you may need an orders table)
            const orderResult = await pool.query('INSERT INTO orders (user_id, total_cost, order_date) VALUES ($1, $2, NOW()) RETURNING id', [userId, totalCost]);
            const orderId = orderResult.rows[0].id;

            for (const item of cartItems) {
                await pool.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)', [orderId, item.productId, item.quantity, item.price]);

                // Update the balance of the merchant/supplier who sold the product
                const sellerResult = await pool.query('SELECT seller_id FROM products WHERE id = $1', [item.productId]);
                const sellerId = sellerResult.rows[0].seller_id;
                await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [item.price * item.quantity, sellerId]);

                // Insert the purchase into purchase history
                await pool.query('INSERT INTO purchase_history (user_id, product_id, quantity, price, purchase_date) VALUES ($1, $2, $3, $4, NOW())', [userId, item.productId, item.quantity, item.price]);
            }

            res.json({ success: true, message: 'Order placed successfully.' });
        } catch (error) {
            console.error('Error placing order:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    });

    // Return merchandise endpoint with 30-day limit
    app.post('/api/return-merchandise', async (req, res) => {
        const { userId, productId, quantity } = req.body;

        try {
            // Get the order item details to check the purchase date and price
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

            // Update the user's balance based on the returned merchandise
            await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [refundAmount, userId]);

            // Update inventory for the merchant
            await pool.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [quantity, productId]);

            res.json({ success: true, message: 'Merchandise returned and refunded successfully.' });
        } catch (error) {
            console.error('Error returning merchandise:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Receive supplies endpoint
    app.post('/api/receive-supplies', async (req, res) => {
        const { productId, quantity } = req.body;

        try {
            // Fetch the product details to calculate the total cost
            const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
            const product = productResult.rows[0];

            if (!product) {
                return res.status(400).json({ success: false, message: 'Product not found.' });
            }

            const totalCost = product.price * quantity;

            // Deduct the total cost from the merchant's balance
            const userId = req.user.id; // Assuming you have middleware to set req.user
            await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [totalCost, userId]);

            // Update the product stock
            await pool.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [quantity, productId]);

            // Check if the product already exists in received_supplies
            const receivedSupplyResult = await pool.query('SELECT * FROM received_supplies WHERE name = $1', [product.name]);
            if (receivedSupplyResult.rows.length > 0) {
                // Update the existing received supply
                await pool.query('UPDATE received_supplies SET stock = stock + $1 WHERE name = $2', [quantity, product.name]);
            } else {
                // Insert into received_supplies table
                await pool.query('INSERT INTO received_supplies (name, description, price, stock, image_url) VALUES ($1, $2, $3, $4, $5)', [product.name, product.description, product.price, quantity, product.image_url]);
            }

            res.json({ success: true, message: 'Supplies received successfully.' });
        } catch (error) {
            console.error('Error receiving supplies:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Fetch products endpoint
    app.get('/api/products', async (req, res) => {
        try {
            console.log('Fetching products from the database...');
            const result = await pool.query('SELECT * FROM products;');
            console.log('Fetched products:', result.rows); // Add this log
            res.json({ success: true, products: result.rows });
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Endpoint to add a new product
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
            console.log('Fetching supplies from the database...');
            const result = await pool.query('SELECT * FROM supplies;');
            console.log('Fetched supplies:', result.rows);
            res.json({ success: true, supplies: result.rows });
        } catch (error) {
            console.error('Error fetching supplies:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
    
    
    // Endpoint to add a new supplies
    app.post('/api/supplies', async (req, res) => {
        const { name, description, price, cost, stock, image_url } = req.body;
        try {
            const result = await pool.query(
                'INSERT INTO supplies (name, description, price, cost, stock, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [name, description, price, cost, stock, image_url]
            );
            res.json({ success: true, supply: result.rows[0] });
        } catch (error) {
            console.error('Error adding supply:', error); // Add this log
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
      

    // Fetch account information endpoint
    app.get('/api/account-info', async (req, res) => {
        const userId = req.query.userId;
        try {
            const result = await pool.query('SELECT username, balance FROM users WHERE id = $1', [userId]);
            res.json({ success: true, account: result.rows[0] });
        } catch (error) {
            console.error('Error fetching account info:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Fetch purchase history endpoint
    app.get('/api/purchase-history', async (req, res) => {
        const userId = req.query.userId;
        try {
            const result = await pool.query('SELECT * FROM purchase_history WHERE user_id = $1', [userId]);
            res.json({ success: true, history: result.rows });
        } catch (error) {
            console.error('Error fetching purchase history:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Update item quantity in the shopping cart
    app.put('/api/cart/:id', async (req, res) => {
        const itemId = req.params.id;
        const { quantity } = req.body;

        try {
            await pool.query('UPDATE shopping_cart SET quantity = $1 WHERE id = $2', [quantity, itemId]);
            res.json({ success: true });
        } catch (error) {
            console.error('Error updating item quantity:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Remove item from the shopping cart
    app.delete('/api/cart/:id', async (req, res) => {
        const itemId = req.params.id;

        try {
            await pool.query('DELETE FROM shopping_cart WHERE id = $1', [itemId]);
            res.json({ success: true });
        } catch (error) {
            console.error('Error removing item from cart:', error);
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
            console.error('Error adding funds:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Add this endpoint for fetching received supplies
    app.get('/api/received-supplies', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM received_supplies');
            res.json({ success: true, supplies: result.rows });
        } catch (error) {
            console.error('Error fetching received supplies:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Serve static HTML files
    app.use(express.static(path.join(__dirname, '../frontend')));

    // Serve login.html as the default page
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/login.html'));
    });

    // Serve specific pages
    app.get('/:page', (req, res) => {
        const page = req.params.page;
        const allowedPages = [
            'login.html', 'merchant.html', 'supplier.html', 'shopper.html', 'dashboard.html',
            'marketplace.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html','shopping-cart.html'
        ];
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
