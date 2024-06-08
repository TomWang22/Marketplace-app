const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors'); // Import the cors package

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
        const result = await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *', [username, hashedPassword, role]);
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
            res.json({ success: true, userId: user.id, role: user.role, token });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
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
    const jwt = require('jsonwebtoken');
    const secretKey = 'your_secret_key'; // Use a more secure key in production
    return jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
}
