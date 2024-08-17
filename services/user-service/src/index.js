const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('winston');

const app = express();
const port = 4001;

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'marketplace-app-main-postgres-1', // IP address of the PostgreSQL container
  database: 'marketplace',
  password: 'postgres',
  port: 5432,
});


// Set up Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Morgan setup to use Winston for logging HTTP requests
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Middleware setup
app.use(bodyParser.json());
app.use(cors());

// Function to generate JWT token
const generateToken = (userId) => {
  const secretKey = 'your_secret_key';
  return jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
};

// Rate limiter to prevent brute-force attacks on login
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: 'Too many login attempts from this IP, please try again later.',
});

// Login route
app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log('Login attempt for username:', username);

    // Fetch user from the database
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (user) {
      console.log('User found:', user);

      // Directly compare plain text passwords
      if (password === user.password) {
        const token = generateToken(user.id);
        res.json({ success: true, userId: user.id, role: user.role, token });
      } else {
        console.log('Password does not match');
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } else {
      console.log('User not found for username:', username);
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    logger.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Internal server error', details: error.message });
  }
});

// User registration route
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO users (username, password, role, balance) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, password, role, 50000] // Store plain text password
    );
    const newUser = result.rows[0];
    res.json({ success: true, user: newUser });
  } catch (error) {
    logger.error('Error during registration:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ success: false, message: 'Username already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error', details: error.message });
    }
  }
});

// Fetch user data by ID
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

    // Combine user data with shopping and search history
    const userData = {
      username: user.username,
      balance: user.balance,
      shoppingHistory: shoppingHistoryResult.rows,
      searchHistory: searchHistoryResult.rows,
    };

    res.json({ success: true, user: userData });
  } catch (error) {
    logger.error('Error fetching user data:', error);
    res.status(500).json({ success: false, message: 'Internal server error', details: error.message });
  }
});

// Fetch account information
app.get('/api/account-info', async (req, res) => {
  const userId = req.query.userId;
  try {
    const result = await pool.query('SELECT username, balance FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, account: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching account info:', error);
    res.status(500).json({ success: false, message: 'Internal server error', details: error.message });
  }
});

// Add funds to a user's account
app.post('/api/add-funds', async (req, res) => {
  const { userId, amount } = req.body;
  logger.info('Received add-funds request:', req.body);

  if (amount <= 0) {
    logger.warn('Invalid amount:', amount);
    return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
  }

  try {
    const result = await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, userId]);
    logger.info('Funds added successfully:', result);
    console.log('Funds added successfully:', result); // Add this for console logging
    res.json({ success: true, message: 'Funds added successfully' });
  } catch (error) {
    logger.error('Error adding funds:', error);
    console.error('Error adding funds:', error); // Add this for console logging
    res.status(500).json({ success: false, message: 'Internal server error', details: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
      const { rows: products } = await pool.query('SELECT * FROM products');
      res.json({ success: true, products });
  } catch (err) {
      console.error('Error fetching products:', err.message);
      res.status(500).json({ success: false, message: 'Error fetching products', error: err.message });
  }
});


// Add a search query to user's search history
// Add a search query to user's search history
app.post("/api/search-history", async (req, res) => {
  const { userId, searchQuery } = req.body;
  console.log("Request Body:", req.body);

  try {
    // Check if the userId exists in the users table
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
    if (userCheck.rowCount === 0) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    // Proceed with inserting the search query into the search_history table
    await pool.query(
      "INSERT INTO search_history (user_id, search_query, search_date) VALUES ($1, $2, NOW())",
      [userId, searchQuery]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding search query to history:", error.message, error.stack);
    res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});



// Start the server
app.listen(port, () => {
  logger.info(`User Service running on port ${port}`);
});
