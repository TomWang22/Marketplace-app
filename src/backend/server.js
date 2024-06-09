const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'marketplace',
    port: 5432,
});

app.use(bodyParser.json());

// Configure CORS to allow requests from your frontend's origin
app.use(cors({
    origin: 'http://127.0.0.1:5500'
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

// Fetch shopping cart items
app.get('/api/cart', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM shopping_cart');
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
        await pool.query('UPDATE inventory SET quantity = quantity + $1 WHERE product_id = $2', [quantity, productId]);

        res.json({ success: true, message: 'Merchandise returned and refunded successfully.' });
    } catch (error) {
        console.error('Error returning merchandise:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Receive supplies endpoint
app.post('/api/receive-supplies', async (req, res) => {
    const { merchantId, productId, quantity } = req.body;

    try {
        // Update inventory for the merchant
        await pool.query('UPDATE inventory SET quantity = quantity + $1 WHERE product_id = $2 AND merchant_id = $3', [quantity, productId, merchantId]);

        res.json({ success: true, message: 'Supplies received successfully.' });
    } catch (error) {
        console.error('Error receiving supplies:', error);
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
        console.error('Error updating item quantity:', error);
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

// Serve login.html as the default page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Function to generate a token (You need to implement this based on your auth strategy)
function generateToken(userId) {
    const secretKey = 'your_secret_key'; // Use a more secure key in production
    return jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
}
