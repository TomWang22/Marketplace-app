const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cluster = require("cluster");
const os = require("os");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const Redis = require("ioredis");
const http = require("http");
const socketIo = require("socket.io");

const numCPUs = os.cpus().length;
const port = 3000;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "marketplace",
  port: 5432,
});

const redisClient = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server, {
    cors: {
      origin: "http://127.0.0.1:5500",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
      credentials: true,
    },
  });
  

  app.use(bodyParser.json());

  app.use(
    cors({
      origin: "http://127.0.0.1:5500",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );
  app.options("*", cors({
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }));
  

  app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      secret: "your_secret_key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    })
  );

  app.use(express.static(path.join(__dirname, "../frontend")));

  io.on("connection", (socket) => {
    console.log("A user connected");

    // Retrieve and send previous chats from the database
    pool.query(
      "SELECT * FROM chat ORDER BY timestamp ASC",
      (error, results) => {
        if (error) {
          console.error("Error retrieving chats from database:", error);
        } else {
          socket.emit("previousChats", results.rows);
        }
      }
    );

    socket.on("sendMessage", async (data) => {
      const { message, userId, role } = data; // role can be 'shopper' or 'merchant'
      const timestamp = new Date();

      try {
        const userResult = await pool.query(
          "SELECT username FROM users WHERE id = $1",
          [userId]
        );
        const username = userResult.rows[0]?.username || "Unknown User";

        // Insert the chat message into the database
        const result = await pool.query(
          "INSERT INTO chat (user_id, role, message, timestamp, username) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [userId, role, message, timestamp, username]
        );
        const chatMessage = result.rows[0];

        // Broadcast the new message to all connected clients
        io.emit("receiveMessage", chatMessage);
      } catch (error) {
        console.error("Error inserting chat message into database:", error);
      }
    });

    socket.on("sendSupplierMessage", async (data) => {
      const { message, userId, role } = data;
      const timestamp = new Date();

      try {
        const userResult = await pool.query(
          "SELECT username FROM users WHERE id = $1",
          [userId]
        );
        const username = userResult.rows[0]?.username || "Unknown User";

        const result = await pool.query(
          "INSERT INTO chat (user_id, role, message, timestamp, username) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [userId, role, message, timestamp, username]
        );
        const chatMessage = result.rows[0];

        io.emit("receiveSupplierMessage", chatMessage);
      } catch (error) {
        console.error("Error inserting chat message into database:", error);
      }
    });

    socket.on("sendMerchantMessage", async (data) => {
      const { message, userId, role } = data;
      const timestamp = new Date();

      try {
        const userResult = await pool.query(
          "SELECT username FROM users WHERE id = $1",
          [userId]
        );
        const username = userResult.rows[0]?.username || "Unknown User";

        const result = await pool.query(
          "INSERT INTO chat (user_id, role, message, timestamp, username) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [userId, role, message, timestamp, username]
        );
        const chatMessage = result.rows[0];

        io.emit("receiveMerchantMessage", chatMessage);
      } catch (error) {
        console.error("Error inserting chat message into database:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
  
  app.post("/api/register", async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        "INSERT INTO users (username, password, role, balance) VALUES ($1, $2, $3, $4) RETURNING *",
        [username, hashedPassword, role, 50000]
      );
      const newUser = result.rows[0];

      // Add default products if the new user is a merchant
      if (role === "merchant") {
        await pool.query("SELECT add_default_products($1)", [newUser.id]);
      }

      // Add default supplies if the new user is a supplier
      if (role === "supplier") {
        await pool.query("SELECT add_default_supplies($1)", [newUser.id]);
      }

      res.json({ success: true, user: newUser });
    } catch (error) {
      if (error.code === "23505") {
        res
          .status(400)
          .json({ success: false, message: "Username already exists" });
      } else {
        console.error("Error during registration:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    }
  });

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username]
      );
      const user = result.rows[0];

      if (user && (await bcrypt.compare(password, user.password))) {
        const token = generateToken(user.id);
        res.json({ success: true, userId: user.id, role: user.role, token });
      } else {
        res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });
 
  async function setAllOrdersToPending() {
    try {
        await pool.query('UPDATE orders SET status = $1', ['pending']);
        console.log('All orders set to pending status.');
    } catch (error) {
        console.error('Error setting orders to pending:', error);
    }
}
 
  app.get("/api/cart", async (req, res) => {
    const userId = req.query.userId;
    try {
      const result = await pool.query(
        "SELECT id, user_id, product_id, product, SUM(quantity) as quantity, price FROM shopping_cart WHERE user_id = $1 GROUP BY id, user_id, product_id, product, price",
        [userId]
      );
      res.json({ success: true, items: result.rows });
    } catch (error) {
      console.error("Error fetching cart items:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/place-order", async (req, res) => {
    const { userId, cartItems } = req.body;

    if (!userId || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid order data.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const totalCost = cartItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        const balanceResult = await client.query(
            "SELECT balance FROM users WHERE id = $1",
            [userId]
        );
        const userBalance = balanceResult.rows[0].balance;

        if (userBalance < totalCost) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: "Insufficient balance to complete the purchase.",
            });
        }

        await client.query(
            "UPDATE users SET balance = balance - $1 WHERE id = $2",
            [totalCost, userId]
        );

        const orderResult = await client.query(
            "INSERT INTO orders (user_id, total_cost, order_date, status) VALUES ($1, $2, NOW(), 'pending') RETURNING id",
            [userId, totalCost]
        );
        const orderId = orderResult.rows[0].id;

        for (const item of cartItems) {
            const { product_id, quantity, price } = item;

            await client.query(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
                [orderId, product_id, quantity, price]
            );

            await client.query(
                "INSERT INTO purchase_history (user_id, product_id, quantity, price, purchase_date) VALUES ($1, $2, $3, $4, NOW())",
                [userId, product_id, quantity, price]
            );

            await client.query(
                "INSERT INTO order_summary (order_id, total_cost, product_id, quantity, user_id, status) VALUES ($1, $2, $3, $4, $5, 'pending')",
                [orderId, totalCost, product_id, quantity, userId]
            );

            const productResult = await client.query(
                "SELECT merchant_id FROM products WHERE id = $1",
                [product_id]
            );
            const merchantId = productResult.rows[0]?.merchant_id;

            if (!merchantId) {
                throw new Error(`Merchant ID not found for product ID ${product_id}.`);
            }

            await client.query(
                "UPDATE users SET balance = balance + $1 WHERE id = $2",
                [price * quantity, merchantId]
            );

            await client.query(
                "INSERT INTO inventory (user_id, product, quantity, price, product_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
                [userId, item.product, quantity, price, product_id]
            );
        }

        await client.query("DELETE FROM shopping_cart WHERE user_id = $1", [userId]);

        await client.query('COMMIT');
        res.json({ success: true, message: "Order placed successfully." });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error placing order:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    } finally {
        client.release();
    }
});


  app.get("/api/inventory", async (req, res) => {
    const userId = req.query.userId;
    try {
      const result = await pool.query(
        "SELECT * FROM inventory WHERE user_id = $1",
        [userId]
      );
      res.json({ success: true, items: result.rows });
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/return-merchandise", async (req, res) => {
    const { userId, productId, quantity } = req.body;

    try {
      const orderItemResult = await pool.query(
        "SELECT oi.price, o.order_date FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.product_id = $1 AND o.user_id = $2 ORDER BY o.order_date DESC LIMIT 1",
        [productId, userId]
      );
      const orderItem = orderItemResult.rows[0];

      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: "No purchase record found for the specified product.",
        });
      }

      const orderDate = new Date(orderItem.order_date);
      const currentDate = new Date();
      const daysDiff = (currentDate - orderDate) / (1000 * 60 * 60 * 24);

      if (daysDiff > 30) {
        return res.status(400).json({
          success: false,
          message: "The return period for this product has expired.",
        });
      }

      const refundAmount = orderItem.price * quantity;
      await pool.query(
        "UPDATE users SET balance = balance + $1 WHERE id = $2",
        [refundAmount, userId]
      );
      await pool.query("UPDATE products SET stock = stock + $1 WHERE id = $2", [
        quantity,
        productId,
      ]);

      res.json({
        success: true,
        message: "Merchandise returned and refunded successfully.",
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/receive-supplies", async (req, res) => {
    const { merchantId, productId, quantity } = req.body;

    try {
      const productResult = await pool.query(
        "SELECT * FROM products WHERE id = $1",
        [productId]
      );
      const product = productResult.rows[0];

      if (!product) {
        return res
          .status(400)
          .json({ success: false, message: "Product not found." });
      }

      const totalCost = product.price * quantity;
      await pool.query(
        "UPDATE users SET balance = balance - $1 WHERE id = $2",
        [totalCost, merchantId]
      );
      await pool.query("UPDATE products SET stock = stock + $1 WHERE id = $2", [
        quantity,
        productId,
      ]);

      const receivedSupplyResult = await pool.query(
        "SELECT * FROM received_supplies WHERE name = $1",
        [product.name]
      );
      if (receivedSupplyResult.rows.length > 0) {
        await pool.query(
          "UPDATE received_supplies SET stock = stock + $1 WHERE name = $2",
          [quantity, product.name]
        );
      } else {
        await pool.query(
          "INSERT INTO received_supplies (name, description, price, stock, image_url) VALUES ($1, $2, $3, $4, $5)",
          [
            product.name,
            product.description,
            product.price,
            quantity,
            product.image_url,
          ]
        );
      }

      res.json({ success: true, message: "Supplies received successfully." });
    } catch (error) {
      console.error("Error receiving supplies:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  setAllOrdersToPending();

  app.post('/api/fulfill-order', async (req, res) => {
    const { orderId, productId, quantity } = req.body;

    console.log('Request payload:', req.body); // Log the request payload

    if (!orderId || !productId || !quantity) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Fetch userId from orders table
            const orderResult = await client.query('SELECT user_id FROM orders WHERE id = $1', [orderId]);
            const order = orderResult.rows[0];
            if (!order) {
                throw new Error('Order not found.');
            }
            const userId = order.user_id;

            // Get product price and stock
            const productResult = await client.query('SELECT price, stock FROM products WHERE id = $1', [productId]);
            const product = productResult.rows[0];

            if (!product) {
                throw new Error('Product not found.');
            }

            if (product.stock < quantity) {
                throw new Error('Insufficient stock.');
            }

            const totalCost = product.price * quantity;

            // Update merchant's balance
            await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [totalCost, userId]);

            // Reduce product stock
            await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [quantity, productId]);

            // Delete the order from orders table
            await client.query('DELETE FROM orders WHERE id = $1', [orderId]);

            await client.query('COMMIT');
            res.json({ success: true, message: 'Order fulfilled and deleted successfully.' });
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Error fulfilling order:', e);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('Error connecting to database:', e);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});



  app.get("/api/products", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM products;");
      res.json({ success: true, products: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/products", async (req, res) => {
    const { name, description, price, stock, image_url } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO products (name, description, price, stock, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [name, description, price, stock, image_url]
      );
      res.json({ success: true, product: result.rows[0] });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.get("/api/purchased-items", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM purchased_items");
      res.json({ success: true, items: result.rows });
    } catch (error) {
      console.error("Error fetching purchased items:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/fulfill-order", async (req, res) => {
    const { orderId, productId, quantity, userId } = req.body;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Add item to inventory
      const insertInventoryQuery = `
            INSERT INTO inventory (user_id, product, quantity, price, product_id, timestamp)
            SELECT $1, product, $2, price, product_id, now()
            FROM shopping_cart
            WHERE product_id = $3
            RETURNING *;
        `;
      const inventoryResult = await client.query(insertInventoryQuery, [
        userId,
        quantity,
        productId,
      ]);

      if (inventoryResult.rows.length === 0) {
        throw new Error("Failed to add item to inventory.");
      }

      // Update merchant balance
      const updateBalanceQuery = `
            UPDATE users
            SET balance = balance + (
                SELECT spent
                FROM purchased_items
                WHERE order_id = $1
            )
            WHERE id = $2
            RETURNING *;
        `;
      const balanceResult = await client.query(updateBalanceQuery, [
        orderId,
        userId,
      ]);

      if (balanceResult.rows.length === 0) {
        throw new Error("Failed to update merchant balance.");
      }

      // Remove item from purchased items
      const deletePurchasedItemQuery = `
            DELETE FROM purchased_items
            WHERE order_id = $1 AND product_id = $2
            RETURNING *;
        `;
      const deleteResult = await client.query(deletePurchasedItemQuery, [
        orderId,
        productId,
      ]);

      if (deleteResult.rows.length === 0) {
        throw new Error("Failed to delete purchased item.");
      }

      await client.query("COMMIT");
      res.json({
        success: true,
        message: "Order fulfilled and item added to inventory.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error fulfilling order:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    } finally {
      client.release();
    }
  });

  app.get("/api/supplies", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM supplies;");
      res.json({ success: true, supplies: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/supplies", async (req, res) => {
    const { name, description, price, cost, stock, image_url } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO supplies (name, description, price, cost, stock, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [name, description, price, cost, stock, image_url]
      );
      res.json({ success: true, supply: result.rows[0] });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.get("/api/account-info", async (req, res) => {
    const userId = req.query.userId;
    try {
      const result = await pool.query(
        "SELECT username, balance FROM users WHERE id = $1",
        [userId]
      );
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({ success: true, account: result.rows[0] });
    } catch (error) {
      console.error("Error fetching account info:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.get("/api/purchase-history", async (req, res) => {
    const userId = req.query.userId;
    try {
      const result = await pool.query(
        "SELECT * FROM purchase_history WHERE user_id = $1",
        [userId]
      );
      res.json({ success: true, history: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    try {
      const productResult = await pool.query(
        "SELECT name, price FROM products WHERE id = $1",
        [productId]
      );
      if (productResult.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      const product = productResult.rows[0];
      const result = await pool.query(
        "INSERT INTO shopping_cart (user_id, product_id, product, quantity, price) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [userId, productId, product.name, quantity, product.price]
      );
      res.json({ success: true, item: result.rows[0] });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    const itemId = req.params.id;
    const { quantity } = req.body;

    try {
      await pool.query("UPDATE shopping_cart SET quantity = $1 WHERE id = $2", [
        quantity,
        itemId,
      ]);
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    const itemId = req.params.id;

    try {
      await pool.query("DELETE FROM shopping_cart WHERE id = $1", [itemId]);
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/add-funds", async (req, res) => {
    const { userId, amount } = req.body;

    if (amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Amount must be greater than zero" });
    }

    try {
      await pool.query(
        "UPDATE users SET balance = balance + $1 WHERE id = $2",
        [amount, userId]
      );
      res.json({ success: true, message: "Funds added successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.get("/api/received-supplies", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM received_supplies");
      res.json({ success: true, supplies: result.rows });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.use(express.static(path.join(__dirname, "../frontend")));

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/login.html"));
  });

  app.get("/:page", (req, res) => {
    const page = req.params.page;
    const allowedPages = [
      "login.html",
      "merchant.html",
      "supplier.html",
      "shopper.html",
      "dashboard.html",
      "marketplace.html",
      "about.html",
      "contact.html",
      "privacy.html",
      "terms.html",
      "shopping-cart.html",
      "product-details.html",
    ];
    if (allowedPages.includes(page)) {
      res.sendFile(path.join(__dirname, `../frontend/${page}`));
    } else {
      res.status(404).send("Page not found");
    }
  });

  app.get("/api/users/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
      const userResult = await pool.query(
        "SELECT username, balance FROM users WHERE id = $1",
        [userId]
      );
      if (userResult.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      const user = userResult.rows[0];

      const shoppingHistoryResult = await pool.query(
        "SELECT id, product_id, quantity, purchase_date FROM purchase_history WHERE user_id = $1",
        [userId]
      );
      const searchHistoryResult = await pool.query(
        "SELECT id, search_query, search_date FROM search_history WHERE user_id = $1",
        [userId]
      );

      const userData = {
        username: user.username,
        balance: user.balance,
        shoppingHistory: shoppingHistoryResult.rows,
        searchHistory: searchHistoryResult.rows,
      };

      res.json({ success: true, user: userData });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/search-history", async (req, res) => {
    const { userId, searchQuery } = req.body;
    try {
      await pool.query(
        "INSERT INTO search_history (user_id, search_query, search_date) VALUES ($1, $2, NOW())",
        [userId, searchQuery]
      );
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });
  // Endpoint for merchants to request supplies
  app.post("/api/request-supply", async (req, res) => {
    const { merchantId, productId, quantity } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO supply_requests (merchant_id, product_id, quantity, request_date) VALUES ($1, $2, $3, NOW()) RETURNING *",
        [merchantId, productId, quantity]
      );
      res.json({ success: true, request: result.rows[0] });
    } catch (error) {
      console.error("Error requesting supply:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  // Endpoint for suppliers to get supply requests
  app.get("/api/supply-requests", async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            "SELECT * FROM supply_requests WHERE status = 'pending'"
        );
        res.json({ success: true, requests: result.rows });
    } catch (error) {
        console.error("Error fetching supply requests:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    } finally {
        client.release();
    }
});


  // Endpoint for suppliers to send supplies
  // Endpoint for suppliers to send supplies
  // Endpoint for suppliers to send supplies
  app.post("/api/send-supplies", async (req, res) => {
    const { supplierId, merchantId, productId, quantity } = req.body;

    console.log("Request payload:", req.body); // Log the request payload

    if (!supplierId || !merchantId || !productId || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    try {
      // Retrieve the supply details
      const supplyResult = await pool.query(
        "SELECT * FROM supplies WHERE id = $1",
        [productId]
      );
      const supply = supplyResult.rows[0];

      if (!supply) {
        return res
          .status(400)
          .json({ success: false, message: "Supply not found." });
      }

      // Check if enough stock is available
      if (supply.stock < quantity) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient stock." });
      }

      // Calculate the total cost and profit
      const totalCost = supply.cost * quantity;
      const totalProfit = (supply.price - supply.cost) * quantity;

      // Reduce the supplier's stock
      await pool.query(
        "UPDATE supplies SET stock = stock - $1, profit = profit + $2 WHERE id = $3",
        [quantity, totalProfit, productId]
      );

      // Update the merchant's balance
      await pool.query(
        "UPDATE users SET balance = balance - $1 WHERE id = $2",
        [totalCost, merchantId]
      );

      // Record the received supplies with necessary adjustments
      const receivedSupplyResult = await pool.query(
        "INSERT INTO received_supplies (name, description, price, stock, image_url, merchant_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [
          supply.name,
          supply.description,
          supply.price,
          quantity,
          supply.image_url,
          merchantId,
        ]
      );

      // Update the supply request status to completed
      await pool.query(
        "UPDATE supply_requests SET status = $1 WHERE merchant_id = $2 AND product_id = $3 AND status = $4",
        ["completed", merchantId, productId, "pending"]
      );

      // Emit the new supply event
      const newSupply = receivedSupplyResult.rows[0];
      io.emit("newSupply", newSupply);

      res.json({
        success: true,
        message: `Sent ${quantity} units of product ID ${productId} to merchant ID ${merchantId}`,
      });
    } catch (error) {
      console.error("Error sending supplies:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  });

  server.listen(port, () => {
    console.log(`Worker ${process.pid} is running on http://localhost:${port}`);
  });

  // Endpoint to fetch past supply requests for a merchant
  app.get("/api/supply-requests", async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT sr.product_id, sr.quantity, sr.merchant_id, sr.status, p.name
            FROM supply_requests sr
            JOIN products p ON sr.product_id = p.id
            WHERE sr.status = 'pending'
        `);
        res.json({ success: true, requests: result.rows });
    } catch (error) {
        console.error("Error fetching supply requests:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    } finally {
        client.release();
    }
});


  app.post("/api/add-supply-by-id", async (req, res) => {
    const { id, quantity } = req.body;

    if (!id || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    try {
      // Retrieve the supply details
      const supplyResult = await pool.query(
        "SELECT * FROM supplies WHERE id = $1",
        [id]
      );
      const supply = supplyResult.rows[0];

      if (!supply) {
        return res
          .status(400)
          .json({ success: false, message: "Supply not found." });
      }

      // Update the supply stock
      await pool.query("UPDATE supplies SET stock = stock + $1 WHERE id = $2", [
        quantity,
        id,
      ]);

      res.json({
        success: true,
        message: `Added ${quantity} units to supply ID ${id}.`,
      });
    } catch (error) {
      console.error("Error adding supply by ID:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  });

  app.post("/api/fulfill-supply-request", async (req, res) => {
    const { supplierId, merchantId, productId, quantity } = req.body;

    if (!supplierId || !merchantId || !productId || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Retrieve the supply details
      const supplyResult = await client.query(
        "SELECT * FROM supplies WHERE id = $1",
        [productId]
      );
      const supply = supplyResult.rows[0];

      if (!supply) {
        throw new Error("Supply not found.");
      }

      if (supply.stock < quantity) {
        throw new Error("Insufficient stock.");
      }

      // Calculate the total cost
      const totalCost = supply.cost * quantity;

      // Reduce the supplier's stock
      await client.query(
        "UPDATE supplies SET stock = stock - $1 WHERE id = $2",
        [quantity, productId]
      );

      // Update the merchant's stock
      const receivedSupplyResult = await client.query(
        "SELECT * FROM received_supplies WHERE name = $1 AND merchant_id = $2",
        [supply.name, merchantId]
      );

      if (receivedSupplyResult.rows.length > 0) {
        await client.query(
          "UPDATE received_supplies SET stock = stock + $1 WHERE name = $2 AND merchant_id = $3",
          [quantity, supply.name, merchantId]
        );
      } else {
        await client.query(
          "INSERT INTO received_supplies (name, description, price, stock, image_url, merchant_id) VALUES ($1, $2, $3, $4, $5, $6)",
          [
            supply.name,
            supply.description,
            supply.price,
            quantity,
            supply.image_url,
            merchantId,
          ]
        );
      }

      // Update the supply request status to completed
      await client.query(
        "UPDATE supply_requests SET status = 'completed' WHERE merchant_id = $1 AND product_id = $2 AND status = 'pending'",
        [merchantId, productId]
      );

      await client.query("COMMIT");

      res.json({
        success: true,
        message: `Sent ${quantity} units of product ID ${productId} to merchant ID ${merchantId}`,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error fulfilling supply request:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    } finally {
      client.release();
    }
  });

  function generateToken(userId) {
    const secretKey = "your_secret_key";
    return jwt.sign({ userId }, secretKey, { expiresIn: "1h" });
  }
}
