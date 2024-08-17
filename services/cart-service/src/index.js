const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');

const app = express();
const port = 4005;

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

// Fetch cart items
app.get('/api/cart', async (req, res) => {
  const userId = req.query.userId;
  try {
    logger.info(`Fetching cart items for userId: ${userId}`);
    const result = await pool.query('SELECT * FROM shopping_cart WHERE user_id = $1', [userId]);
    logger.info(`Cart items fetched: ${JSON.stringify(result.rows)}`);
    res.json({ items: result.rows });
  } catch (error) {
    logger.error('Error fetching cart items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add an item to the cart
app.post('/api/cart', async (req, res) => {
  const { userId, productId, quantity, size } = req.body;

  if (!userId || !productId || !quantity || !size) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  try {
    logger.info(`Adding item to cart: ${JSON.stringify(req.body)}`);
    const productResult = await pool.query('SELECT name, price, image_url FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length === 0) {
      logger.warn(`Product not found: ${productId}`);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = productResult.rows[0];
    const result = await pool.query('INSERT INTO shopping_cart (user_id, product_id, product, quantity, price, size, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [userId, productId, product.name, quantity, product.price, size, product.image_url]);
    logger.info(`Item added to cart: ${JSON.stringify(result.rows[0])}`);
    res.json({ success: true, item: result.rows[0] });
  } catch (error) {
    logger.error('Error adding item to cart:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update the quantity of an item in the cart
app.put('/api/cart/:id', async (req, res) => {
  const itemId = req.params.id;
  const { quantity } = req.body;

  try {
    logger.info(`Updating cart item ${itemId} with quantity ${quantity}`);
    await pool.query('UPDATE shopping_cart SET quantity = $1 WHERE id = $2', [quantity, itemId]);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error updating cart item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Remove an item from the cart
app.delete('/api/cart/:id', async (req, res) => {
  const itemId = req.params.id;

  try {
    logger.info(`Removing item ${itemId} from cart`);
    await pool.query('DELETE FROM shopping_cart WHERE id = $1', [itemId]);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error removing cart item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.listen(port, () => {
  logger.info(`Cart Service running on port ${port}`);
});
