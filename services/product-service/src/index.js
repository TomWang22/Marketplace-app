const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');

const app = express();
const port = 4002;
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

// Default route or API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'Product Service API',
    routes: {
      '/api/products': 'Get all products',
      '/api/products/:id': 'Get product by ID',
      '/api/reviews': 'Get reviews for a product',
      '/api/products (POST)': 'Add a new product',
      '/api/reviews (POST)': 'Add a new review'
    }
  });
});

// Ignore favicon requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Fetch all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products;');
    res.json({ success: true, products: result.rows });
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Fetch product by ID
// Fetch product by ID
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
      const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      if (result.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Product not found' });
      }
      const product = result.rows[0];
      console.log("Fetched product:", product); // Log the product details
      res.json({ success: true, product });
  } catch (error) {
      logger.error('Error fetching product:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Add a new product
app.post('/api/products', async (req, res) => {
  const { name, description, price, stock, image_url } = req.body;
  try {
    const result = await pool.query('INSERT INTO products (name, description, price, stock, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *', [name, description, price, stock, image_url]);
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    logger.error('Error adding product:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Fetch product price by ID
app.get('/api/products/:id/price', async (req, res) => {
  const { id } = req.params;
  try {
      const result = await pool.query('SELECT price FROM products WHERE id = $1', [id]);
      if (result.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Product not found' });
      }
      const { price } = result.rows[0];
      res.json({ success: true, price });
  } catch (error) {
      logger.error('Error fetching product price:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get product reviews
// Get product reviews
 // Get product reviews
app.get('/api/reviews', async (req, res) => {
  const { productId } = req.query;

  // Log incoming request data
  logger.info(`Received request for product reviews with productId: ${productId}`);
  
  if (!productId) {
    logger.warn('No productId provided in request');
    return res.status(400).json({ success: false, message: 'Product ID is required' });
  }

  try {
    // Execute the query
    logger.info(`Executing query: SELECT * FROM reviews WHERE product_id = $1 with productId: ${productId}`);
    const result = await pool.query('SELECT * FROM reviews WHERE product_id = $1', [productId]);

    // Log the result length and some sample data
    logger.info(`Found ${result.rows.length} reviews for product_id: ${productId}`);
    if (result.rows.length > 0) {
      logger.info(`Sample review data: ${JSON.stringify(result.rows[0])}`);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No reviews found for this product' });
    }

    res.json(result.rows);  // Return all reviews, not just one
  } catch (error) {
    logger.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



// Add a review
app.post('/api/reviews', async (req, res) => {
  const { product_id, username, text, rating } = req.body;
  if (!product_id || !username || !text || !rating) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const result = await pool.query('INSERT INTO reviews (product_id, username, text, rating, date) VALUES ($1, $2, $3, $4, NOW()) RETURNING *', [product_id, username, text, rating]);
    res.status(201).json({ success: true, review: result.rows[0] });
  } catch (error) {
    logger.error('Error inserting review:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Handle undefined routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

app.listen(port, () => {
  logger.info(`Product Service running on port ${port}`);
});
