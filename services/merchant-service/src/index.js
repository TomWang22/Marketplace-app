const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const winston = require('winston');
require('dotenv').config();

const app = express();
const port = 4007;

// Set up PostgreSQL connection
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

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Middleware setup
app.use(bodyParser.json());

// CORS configuration
app.use(cors({
  origin: '*', // Change '*' to the specific frontend URL you want to allow, e.g., 'http://localhost:5000'
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));

// Request Supply
app.post('/api/request-supply', async (req, res) => {
  const { merchantId, productId, quantity } = req.body;

  if (!merchantId || !productId || !quantity) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    await pool.query(
      'INSERT INTO supply_requests (merchant_id, product_id, quantity, status) VALUES ($1, $2, $3, $4)', 
      [merchantId, productId, quantity, 'pending']
    );
    res.json({ success: true, message: 'Supply requested successfully' });
  } catch (error) {
    logger.error('Error requesting supply:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/pending-orders', async (req, res) => {
  const merchantId = req.query.merchantId;

  if (!merchantId) {
    return res.status(400).json({ success: false, message: 'Merchant ID is required' });
  }

  try {
    const result = await pool.query(
      `SELECT os.id AS order_summary_id, os.order_id, os.product_id, os.quantity, os.total_cost, p.name AS product_name, p.image_url
      FROM order_summary os
      JOIN products p ON os.product_id = p.id
      WHERE os.status = 'pending' AND p.merchant_id = $1`,
      [merchantId]
    );
    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/fulfill-order', async (req, res) => {
  const { orderSummaryId } = req.body;

  if (!orderSummaryId) {
    return res.status(400).json({ success: false, message: 'Order Summary ID is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Fetch and update the order summary
    const updateResult = await client.query(
      `UPDATE order_summary 
       SET status = 'fulfilled' 
       WHERE id = $1 
       RETURNING order_id, product_id, quantity, user_id`,
      [orderSummaryId]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Order Summary ID not found.');
    }

    const { order_id, product_id, quantity, user_id } = updateResult.rows[0];

    // Calculate profit and insert into inventory
    const productResult = await client.query(
      'SELECT price FROM products WHERE id = $1',
      [product_id]
    );
    const price = productResult.rows[0].price;
    const profit = price * quantity;

    await client.query(
      'INSERT INTO inventory (user_id, product_id, quantity, price, timestamp) VALUES ($1, $2, $3, $4, NOW())',
      [user_id, product_id, quantity, price]
    );

    // Check if all items in the order are fulfilled
    const remainingItems = await client.query(
      'SELECT 1 FROM order_summary WHERE order_id = $1 AND status = $2',
      [order_id, 'pending']
    );

    // If no remaining items are pending, update the order status to 'fulfilled'
    if (remainingItems.rowCount === 0) {
      await client.query(
        'UPDATE orders SET status = $1 WHERE id = $2',
        ['fulfilled', order_id]
      );
    }

    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Order fulfilled successfully', 
      user_id, 
      product_id, 
      quantity, 
      profit,
      order_id 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fulfilling order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
});


// Fetch Received Supplies
app.get('/api/received-supplies', async (req, res) => {
  const merchantId = req.query.merchantId;

  if (!merchantId) {
    return res.status(400).json({ success: false, message: 'Merchant ID is required' });
  }

  try {
    const result = await pool.query('SELECT * FROM received_supplies WHERE merchant_id = $1', [merchantId]);
    res.json({ success: true, supplies: result.rows });
  } catch (error) {
    logger.error('Error fetching received supplies:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/send-merchandise', async (req, res) => {
  const { customerId, productId, quantity } = req.body;

  if (!customerId || !productId || !quantity) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Retrieve product details
    const productResult = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = productResult.rows[0];
    if (product.stock < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Not enough stock available' });
    }

    // Calculate the profit
    const profit = product.price * quantity;

    // Update the product's stock
    await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [quantity, productId]);

    // Insert into inventory for the customer including the product name
    await client.query(
      'INSERT INTO inventory (user_id, product_id, quantity, price, product, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())', 
      [customerId, productId, quantity, product.price, product.name]
    );

    // Update the merchant's balance with the profit
    await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [profit, product.merchant_id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Merchandise sent successfully, profit added to merchant\'s account.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sending merchandise:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Start the server
app.listen(port, () => {
  logger.info(`Merchant Service running on port ${port}`);
});
