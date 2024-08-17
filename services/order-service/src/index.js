const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const http = require('http');

const app = express();
const port = process.env.PORT || 4003;

const pool = new Pool({
  user: 'postgres',
  host: 'marketplace-app-main-postgres-1', // IP address of the PostgreSQL container
  database: 'marketplace',
  password: 'postgres',
  port: 5432,
});

// Winston logger configuration
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

// Morgan middleware for logging HTTP requests
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

app.use(bodyParser.json());
app.use(cors());

// Place an order
app.post('/api/place-order', async (req, res) => {
  const { userId, cartItems } = req.body;

  if (!userId || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid order data.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const totalCost = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    const balanceResult = await client.query('SELECT balance FROM users WHERE id = $1', [userId]);
    const userBalance = balanceResult.rows[0].balance;

    if (userBalance < totalCost) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance to complete the purchase.',
      });
    }

    await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [totalCost, userId]);

    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_cost, order_date, status) VALUES ($1, $2, NOW(), \'pending\') RETURNING id',
      [userId, totalCost]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of cartItems) {
      const { product_id, quantity, price } = item;

      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, product_id, quantity, price]
      );

      await client.query(
        'INSERT INTO purchase_history (user_id, product_id, quantity, price, purchase_date) VALUES ($1, $2, $3, $4, NOW())',
        [userId, product_id, quantity, price]
      );

      await client.query(
        'INSERT INTO order_summary (order_id, total_cost, product_id, quantity, user_id, status) VALUES ($1, $2, $3, $4, $5, \'pending\')',
        [orderId, totalCost, product_id, quantity, userId]
      );

      const productResult = await client.query('SELECT merchant_id FROM products WHERE id = $1', [product_id]);
      const merchantId = productResult.rows[0]?.merchant_id;

      if (!merchantId) {
        throw new Error(`Merchant ID not found for product ID ${product_id}.`);
      }

      await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [price * quantity, merchantId]);
    }

    await client.query('DELETE FROM shopping_cart WHERE user_id = $1', [userId]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Order placed successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error placing order:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  } finally {
    client.release();
  }
});

// Return merchandise
app.post('/api/return-merchandise', async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    const orderItemResult = await pool.query(
      'SELECT oi.price, o.order_date FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.product_id = $1 AND o.user_id = $2 ORDER BY o.order_date DESC LIMIT 1',
      [productId, userId]
    );
    const orderItem = orderItemResult.rows[0];

    if (!orderItem) {
      return res.status(400).json({
        success: false,
        message: 'No purchase record found for the specified product.',
      });
    }

    const orderDate = new Date(orderItem.order_date);
    const currentDate = new Date();
    const daysDiff = (currentDate - orderDate) / (1000 * 60 * 60 * 24);

    if (daysDiff > 30) {
      return res.status(400).json({
        success: false,
        message: 'The return period for this product has expired.',
      });
    }

    const refundAmount = orderItem.price * quantity;
    await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [refundAmount, userId]);
    await pool.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [quantity, productId]);

    res.json({ success: true, message: 'Merchandise returned and refunded successfully.' });
  } catch (error) {
    logger.error('Error returning merchandise:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Fetch purchase history
app.get('/api/purchase-history', async (req, res) => {
  const userId = req.query.userId;
  
  try {
    const result = await pool.query(`
      SELECT 
        ph.id, 
        ph.user_id, 
        ph.product_id, 
        p.name AS product_name, 
        ph.quantity, 
        ph.price, 
        ph.purchase_date, 
        p.image_url
      FROM 
        purchase_history ph
      JOIN 
        products p ON ph.product_id = p.id
      WHERE 
        ph.user_id = $1
      ORDER BY 
        ph.purchase_date DESC;
    `, [userId]);

    res.json({ success: true, history: result.rows });
  } catch (error) {
    logger.error('Error fetching purchase history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Fetch incomplete orders
app.get('/api/incomplete-orders', async (req, res) => {
  const merchantId = req.query.merchantId;

  if (!merchantId) {
    return res.status(400).json({ success: false, message: 'Merchant ID is required' });
  }

  try {
    const result = await pool.query('SELECT * FROM orders WHERE merchant_id = $1 AND status = $2', [merchantId, 'pending']);
    res.json({ success: true, orders: result.rows });
  } catch (error) {
    logger.error('Error fetching incomplete orders:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Fulfill order
app.post('/api/fulfill-order', async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID is required' });
  }

  try {
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['fulfilled', orderId]);
    res.json({ success: true, message: 'Order fulfilled successfully' });
  } catch (error) {
    logger.error('Error fulfilling order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Fetch inventory items
app.get('/api/inventory', async (req, res) => {
  const userId = req.query.userId;
  try {
    const result = await pool.query('SELECT * FROM inventory WHERE user_id = $1', [userId]);
    res.json({ success: true, items: result.rows });
  } catch (error) {
    logger.error('Error fetching inventory items:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.listen(port, () => {
  logger.info(`Order Service running on port ${port}`);
});
