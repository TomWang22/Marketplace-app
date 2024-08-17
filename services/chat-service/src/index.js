const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Adjust this to match your client origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});
const port = 4004;

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

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  pool.query('SELECT * FROM chat ORDER BY timestamp ASC', (error, results) => {
    if (error) {
      logger.error('Error retrieving chats from database:', error);
    } else {
      socket.emit('previousChats', results.rows);
    }
  });

  socket.on('sendMessage', async (data) => {
    const { message, userId, role } = data;
    const timestamp = new Date();

    try {
      const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
      const username = userResult.rows[0]?.username || 'Unknown User';

      const result = await pool.query(
        'INSERT INTO chat (user_id, role, message, timestamp, username) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, role, message, timestamp, username]
      );
      const chatMessage = result.rows[0];

      io.emit('receiveMessage', chatMessage);
    } catch (error) {
      logger.error('Error inserting chat message into database:', error);
    }
  });

  socket.on('disconnect', () => {
    logger.info('A user disconnected');
  });
});

// Define the missing API route
app.post('/api/send-message', async (req, res) => {
  const { message, userId, role } = req.body;
  const timestamp = new Date();

  try {
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    const username = userResult.rows[0]?.username || 'Unknown User';

    const result = await pool.query(
      'INSERT INTO chat (user_id, role, message, timestamp, username) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, role, message, timestamp, username]
    );
    const chatMessage = result.rows[0];

    io.emit('receiveMessage', chatMessage);
    res.status(200).json({ success: true, chatMessage });
  } catch (error) {
    logger.error('Error inserting chat message into database:', error);
    res.status(500).json({ success: false, message: 'Internal server error', details: error.message });
  }
});

server.listen(port, () => {
  logger.info(`Chat Service running on port ${port}`);
});
