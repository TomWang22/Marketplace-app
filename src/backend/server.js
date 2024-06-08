const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const port = 3000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'marketplace',
    port: 5432,
});

app.use(bodyParser.json());

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

// Serve login.html as the default page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
