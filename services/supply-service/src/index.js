const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const port = 4006;

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

const server = http.createServer(app);
const io = socketIo(server);

// Fetch all supplies
app.get('/api/supplies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM supplies;');
    res.json({ success: true, supplies: result.rows });
  } catch (error) {
    logger.error('Error fetching supplies:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Add supply stock by supply ID
app.post('/api/add-supply-by-id', async (req, res) => {
  const { id, quantity } = req.body;

  if (!id || !quantity) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    const supplyResult = await pool.query('SELECT * FROM supplies WHERE id = $1', [id]);
    const supply = supplyResult.rows[0];

    if (!supply) {
      return res.status(400).json({ success: false, message: 'Supply not found.' });
    }

    await pool.query('UPDATE supplies SET stock = stock + $1 WHERE id = $2', [quantity, id]);
    res.json({ success: true, message: `Added ${quantity} units to supply ID ${id}.` });
  } catch (error) {
    logger.error('Error adding supply by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Fulfill a supply request
// Fulfill a supply request
// Fulfill a supply request and delete it
app.post('/api/fulfill-supply-request', async (req, res) => {
  const { supplierId, merchantId, productId, quantity } = req.body;

  if (!supplierId || !merchantId || !productId || !quantity) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const supplyResult = await client.query('SELECT * FROM supplies WHERE id = $1', [productId]);
    const supply = supplyResult.rows[0];

    if (!supply) {
      throw new Error('Supply not found.');
    }

    if (supply.stock < quantity) {
      throw new Error('Insufficient stock.');
    }

    // Update the stock of the product
    await client.query('UPDATE supplies SET stock = stock - $1 WHERE id = $2', [quantity, productId]);

    // Update or insert received supply for the merchant
    const receivedSupplyResult = await client.query('SELECT * FROM received_supplies WHERE name = $1 AND merchant_id = $2', [supply.name, merchantId]);

    if (receivedSupplyResult.rows.length > 0) {
      await client.query('UPDATE received_supplies SET stock = stock + $1 WHERE name = $2 AND merchant_id = $3', [quantity, supply.name, merchantId]);
    } else {
      await client.query('INSERT INTO received_supplies (name, description, price, stock, image_url, merchant_id) VALUES ($1, $2, $3, $4, $5, $6)', [supply.name, supply.description, supply.price, quantity, supply.image_url, merchantId]);
    }

    // Delete the supply request
    await client.query('DELETE FROM supply_requests WHERE merchant_id = $1 AND product_id = $2', [merchantId, productId]);

    await client.query('COMMIT');

    // Notify all connected clients about the update
    io.emit('requestFulfilled', {
      merchantId,
      productId,
      quantity
    });

    res.json({ success: true, message: `Sent ${quantity} units of product ID ${productId} to merchant ID ${merchantId}` });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error fulfilling supply request:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  } finally {
    client.release();
  }
});

// Fetch all supplies
app.get('/api/supplies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM supplies;');
    res.json({ success: true, supplies: result.rows });
  } catch (error) {
    logger.error('Error fetching supplies:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Send supplies from a supplier to a merchant
// Send supplies from a supplier to a merchant
app.post('/api/send-supplies', async (req, res) => {
  const { supplierId, merchantId, productId, quantity } = req.body;

  if (!supplierId || !merchantId || !productId || !quantity) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
      const supplyResult = await pool.query('SELECT * FROM supplies WHERE id = $1', [productId]);
      const supply = supplyResult.rows[0];

      if (!supply) {
          return res.status(400).json({ success: false, message: 'Supply not found.' });
      }

      if (supply.stock < quantity) {
          return res.status(400).json({ success: false, message: 'Insufficient stock.' });
      }

      const totalCost = supply.cost * quantity;
      const totalProfit = (supply.price - supply.cost) * quantity;

      await pool.query(
          'UPDATE supplies SET stock = stock - $1, profit = profit + $2 WHERE id = $3',
          [quantity, totalProfit, productId]
      );

      await pool.query(
          'UPDATE users SET balance = balance - $1 WHERE id = $2',
          [totalCost, merchantId]
      );

      const receivedSupplyResult = await pool.query(
          'INSERT INTO received_supplies (name, description, price, stock, image_url, merchant_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [supply.name, supply.description, supply.price, quantity, supply.image_url, merchantId]
      );

      await pool.query(
          'UPDATE supply_requests SET status = $1 WHERE merchant_id = $2 AND product_id = $3 AND status = $4',
          ['completed', merchantId, productId, 'pending']
      );

      const newSupply = receivedSupplyResult.rows[0];
      io.emit('newSupply', {
          message: `Sent ${quantity} units of product ID ${productId} to merchant ID ${merchantId}`,
          newSupply
      });

      res.json({ success: true, message: `Sent ${quantity} units of product ID ${productId} to merchant ID ${merchantId}` });
  } catch (error) {
      logger.error('Error sending supplies:', error);
      res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});


// Fetch pending supply requests
app.get('/api/supply-requests', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM supply_requests WHERE status = \'pending\'');
    res.json({ success: true, requests: result.rows });
  } catch (error) {
    logger.error('Error fetching supply requests:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Receive supplies for a merchant
app.post('/api/receive-supplies', async (req, res) => {
  const { merchantId, productId, quantity } = req.body;

  try {
    const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    const product = productResult.rows[0];

    if (!product) {
      return res.status(400).json({ success: false, message: 'Product not found.' });
    }

    const totalCost = product.price * quantity;
    await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [totalCost, merchantId]);
    await pool.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [quantity, productId]);

    const receivedSupplyResult = await pool.query('SELECT * FROM received_supplies WHERE name = $1', [product.name]);
    if (receivedSupplyResult.rows.length > 0) {
      await pool.query('UPDATE received_supplies SET stock = stock + $1 WHERE name = $2', [quantity, product.name]);
    } else {
      await pool.query('INSERT INTO received_supplies (name, description, price, stock, image_url) VALUES ($1, $2, $3, $4, $5)', [product.name, product.description, product.price, quantity, product.image_url]);
    }

    res.json({ success: true, message: 'Supplies received successfully.' });
  } catch (error) {
    logger.error('Error receiving supplies:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

server.listen(port, () => {
  logger.info(`Supply Service running on port ${port}`);
});
