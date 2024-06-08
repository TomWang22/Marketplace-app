const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const port = 3000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'marketplace',
    password: 'your_password', // Ensure you replace this with your actual database password
    port: 5432,
});

app.use(bodyParser.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// User registration
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
        console.error('Error registering user:', error.message);

        if (error.code === '23505') {
            // Duplicate username
            res.status(400).json({ success: false, message: 'Username already exists' });
        } else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
});

// User login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login request received:', { username });

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = userResult.rows[0];
        console.log('User found:', user);

        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user.id, role: user.role }, 'your_secret_key', { expiresIn: '1h' });
            res.json({ token, role: user.role });
        } else {
            console.log('Invalid credentials');
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login failed:', error.message);
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
