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
  app.options(
    "*",
    cors({
      origin: "http://127.0.0.1:5500",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

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

  /**
   * @api {post} /api/register Register a new user
   * @apiName RegisterUser
   * @apiGroup User
   *
   * @apiParam {String} username The username of the new user.
   * @apiParam {String} password The password of the new user.
   * @apiParam {String} role The role of the new user ('shopper', 'merchant', 'supplier').
   *
   * @apiSuccess {Object} user The newly created user.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {post} /api/login Login a user
   * @apiName LoginUser
   * @apiGroup User
   *
   * @apiParam {String} username The username of the user.
   * @apiParam {String} password The password of the user.
   *
   * @apiSuccess {Number} userId The ID of the logged-in user.
   * @apiSuccess {String} role The role of the logged-in user.
   * @apiSuccess {String} token The JWT token for authentication.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {get} /api/cart Fetch cart items for a user
   * @apiName GetCartItems
   * @apiGroup Cart
   *
   * @apiParam {Number} userId The ID of the user.
   *
   * @apiSuccess {Array} items The items in the user's cart.
   * @apiError {String} message Error message.
   */
  app.get("/api/cart", async (req, res) => {
    const userId = req.query.userId;

    try {
      const result = await pool.query(
        "SELECT * FROM shopping_cart WHERE user_id = $1",
        [userId]
      );
      res.json({ items: result.rows });
    } catch (error) {
      console.error("Error fetching cart items:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  function notifyProductUpdate(productId, updatedQuantity) {
    io.emit("productUpdate", { productId, updatedQuantity });
  }

  /**
   * @api {post} /api/place-order Place an order for a user
   * @apiName PlaceOrder
   * @apiGroup Order
   *
   * @apiParam {Number} userId The ID of the user.
   * @apiParam {Array} cartItems The items in the user's cart.
   *
   * @apiSuccess {String} message Success message.
   * @apiError {String} message Error message.
   */
  app.post("/api/place-order", async (req, res) => {
    const { userId, cartItems } = req.body;

    if (!userId || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order data." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

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
        await client.query("ROLLBACK");
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
          "SELECT merchant_id, stock, name FROM products WHERE id = $1",
          [product_id]
        );
        const product = productResult.rows[0];
        const merchantId = product.merchant_id;

        if (!merchantId) {
          throw new Error(
            `Merchant ID not found for product ID ${product_id}.`
          );
        }

        await client.query(
          "UPDATE users SET balance = balance + $1 WHERE id = $2",
          [price * quantity, merchantId]
        );

        // Reduce product stock and notify clients
        const newStock = product.stock - quantity;
        await client.query("UPDATE products SET stock = $1 WHERE id = $2", [
          newStock,
          product_id,
        ]);
        notifyProductUpdate(product_id, newStock); // Notify clients about stock update

        await client.query(
          "INSERT INTO inventory (user_id, product, quantity, price, product_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
          [userId, product.name, quantity, price, product_id]
        );
      }

      await client.query("DELETE FROM shopping_cart WHERE user_id = $1", [
        userId,
      ]);

      await client.query("COMMIT");
      res.json({ success: true, message: "Order placed successfully." });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error placing order:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    } finally {
      client.release();
    }
  });

  /**
   * @api {get} /api/inventory Fetch inventory items for a user
   * @apiName GetInventory
   * @apiGroup Inventory
   *
   * @apiParam {Number} userId The ID of the user.
   *
   * @apiSuccess {Array} items The items in the user's inventory.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {post} /api/return-merchandise Return merchandise for a user
   * @apiName ReturnMerchandise
   * @apiGroup Merchandise
   *
   * @apiParam {Number} userId The ID of the user.
   * @apiParam {Number} productId The ID of the product to be returned.
   * @apiParam {Number} quantity The quantity of the product to be returned.
   *
   * @apiSuccess {String} message Success message.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {post} /api/receive-supplies Receive supplies for a merchant
   * @apiName ReceiveSupplies
   * @apiGroup Supplies
   *
   * @apiParam {Number} merchantId The ID of the merchant.
   * @apiParam {Number} productId The ID of the product.
   * @apiParam {Number} quantity The quantity of the product.
   *
   * @apiSuccess {String} message Success message.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {post} /api/fulfill-order Fulfill an order
   * @apiName FulfillOrder
   * @apiGroup Order
   *
   * @apiParam {Number} orderId The ID of the order.
   * @apiParam {Number} productId The ID of the product in the order.
   * @apiParam {Number} quantity The quantity of the product to fulfill.
   *
   * @apiSuccess {String} message Success message.
   * @apiError {String} message Error message.
   */
  app.post("/api/fulfill-order", async (req, res) => {
    const { orderId, productId, quantity } = req.body;

    console.log("Request payload:", req.body); // Log the request payload

    if (!orderId || !productId || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Fetch userId and status from order_summary table
        const orderResult = await client.query(
          "SELECT user_id, status FROM order_summary WHERE order_id = $1 AND product_id = $2",
          [orderId, productId]
        );
        const order = orderResult.rows[0];
        if (!order) {
          throw new Error("Order not found.");
        }
        if (order.status === "fulfilled") {
          throw new Error("Order already fulfilled.");
        }
        const userId = order.user_id;

        // Get product price and stock
        const productResult = await client.query(
          "SELECT price, stock FROM products WHERE id = $1",
          [productId]
        );
        const product = productResult.rows[0];

        if (!product) {
          throw new Error("Product not found.");
        }

        if (product.stock < quantity) {
          throw new Error("Insufficient stock.");
        }

        const totalCost = product.price * quantity;

        // Update merchant's balance
        await client.query(
          "UPDATE users SET balance = balance + $1 WHERE id = $2",
          [totalCost, userId]
        );

        // Reduce product stock
        await client.query("UPDATE products SET stock = $1 WHERE id = $2", [
          quantity,
          productId,
        ]);

        // Mark the order as fulfilled in order_summary table
        await client.query(
          "UPDATE order_summary SET status = 'fulfilled' WHERE order_id = $1 AND product_id = $2",
          [orderId, productId]
        );

        // Insert the fulfilled order into the inventory table
        await client.query(
          "INSERT INTO inventory (user_id, product, quantity, price, product_id, timestamp) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)",
          [userId, product.name, quantity, product.price, productId]
        );

        await client.query("COMMIT");
        res.json({
          success: true,
          message: "Order fulfilled successfully.",
        });
      } catch (e) {
        await client.query("ROLLBACK");
        console.error("Error fulfilling order:", e);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      } finally {
        client.release();
      }
    } catch (e) {
      console.error("Error connecting to database:", e);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  });

  /**
   * @api {get} /api/unfulfilled-orders Fetch unfulfilled orders
   * @apiName GetUnfulfilledOrders
   * @apiGroup Order
   *
   * @apiSuccess {Array} orders The list of unfulfilled orders.
   * @apiError {String} message Error message.
   */
  app.get("/api/unfulfilled-orders", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM order_summary WHERE status = 'pending'"
      );
      res.json({ success: true, orders: result.rows });
    } catch (error) {
      console.error("Error fetching unfulfilled orders:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  /**
   * @api {get} /api/products Fetch all products
   * @apiName GetProducts
   * @apiGroup Product
   *
   * @apiSuccess {Array} products The list of all products.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {get} /api/products/:id Fetch a product by ID
   * @apiName GetProductById
   * @apiGroup Product
   *
   * @apiParam {Number} id The ID of the product.
   *
   * @apiSuccess {Object} product The product details.
   * @apiError {String} message Error message.
   */
  app.get("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("SELECT * FROM products WHERE id = $1", [
        id,
      ]);
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching product:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  /**
   * @api {get} /api/reviews Fetch product reviews
   * @apiName GetProductReviews
   * @apiGroup Review
   *
   * @apiParam {Number} productId The ID of the product.
   *
   * @apiSuccess {Array} reviews The list of reviews for the product.
   * @apiError {String} message Error message.
   */
  app.get("/api/reviews", async (req, res) => {
    const { productId } = req.query;
    try {
      const result = await pool.query(
        "SELECT * FROM reviews WHERE product_id = $1",
        [productId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  /**
   * @api {post} /api/products Add a new product
   * @apiName AddProduct
   * @apiGroup Product
   *
   * @apiParam {String} name The name of the product.
   * @apiParam {String} description The description of the product.
   * @apiParam {Number} price The price of the product.
   * @apiParam {Number} stock The stock quantity of the product.
   * @apiParam {String} image_url The image URL of the product.
   *
   * @apiSuccess {Object} product The newly created product.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {get} /api/purchased-items Fetch purchased items
   * @apiName GetPurchasedItems
   * @apiGroup Purchase
   *
   * @apiSuccess {Array} items The list of purchased items.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {get} /api/product/:id Fetch product details by ID
   * @apiName GetProductDetailsById
   * @apiGroup Product
   *
   * @apiParam {Number} id The ID of the product.
   *
   * @apiSuccess {Object} product The product details with total quantity.
   * @apiError {String} message Error message.
   */
  app.get("/api/product/:id", async (req, res) => {
    const productId = req.params.id;

    try {
      // Fetch the product details with the total quantity
      const result = await pool.query(
        `SELECT 
         name, 
         description, 
         price, 
         image_url, 
         SUM(stock) AS total_quantity 
       FROM 
         products 
       WHERE 
         name = (
           SELECT name FROM products WHERE id = $1
         ) 
       GROUP BY 
         name, 
         description, 
         price, 
         image_url`,
        [productId]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      res.json({ success: true, product: result.rows[0] });
    } catch (error) {
      console.error("Error fetching product details:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  /**
   * @api {get} /api/account-info Fetch account information for a user
   * @apiName GetAccountInfo
   * @apiGroup Account
   *
   * @apiParam {Number} userId The ID of the user.
   *
   * @apiSuccess {Object} account The account information of the user.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {get} /api/purchase-history Fetch purchase history for a user
   * @apiName GetPurchaseHistory
   * @apiGroup Purchase
   *
   * @apiParam {Number} userId The ID of the user.
   *
   * @apiSuccess {Array} history The purchase history of the user.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {post} /api/cart Add an item to the cart
   * @apiName AddToCart
   * @apiGroup Cart
   *
   * @apiParam {Number} userId The ID of the user.
   * @apiParam {Number} productId The ID of the product.
   * @apiParam {Number} quantity The quantity of the product.
   * @apiParam {String} size The size of the product.
   *
   * @apiSuccess {Object} item The newly added cart item.
   * @apiError {String} message Error message.
   */
  app.post("/api/cart", async (req, res) => {
    const { userId, productId, quantity, size } = req.body;

    // Log the received request body
    console.log("Received request body:", req.body);

    if (!userId || !productId || !quantity || !size) {
      console.error("Missing fields in request body:", req.body);
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    try {
      const productResult = await pool.query(
        "SELECT name, price, image_url FROM products WHERE id = $1",
        [productId]
      );
      if (productResult.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      const product = productResult.rows[0];
      const result = await pool.query(
        "INSERT INTO shopping_cart (user_id, product_id, product, quantity, price, size, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [
          userId,
          productId,
          product.name,
          quantity,
          product.price,
          size,
          product.image_url,
        ]
      );
      res.json({ success: true, item: result.rows[0] });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  /**
   * @api {put} /api/cart/:id Update the quantity of an item in the cart
   * @apiName UpdateCartItem
   * @apiGroup Cart
   *
   * @apiParam {Number} id The ID of the cart item.
   * @apiParam {Number} quantity The new quantity of the item.
   *
   * @apiSuccess {String} message Success message.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {delete} /api/cart/:id Remove an item from the cart
   * @apiName RemoveFromCart
   * @apiGroup Cart
   *
   * @apiParam {Number} id The ID of the cart item.
   *
   * @apiSuccess {String} message Success message.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {post} /api/add-funds Add funds to a user's account
   * @apiName AddFunds
   * @apiGroup Account
   *
   * @apiParam {Number} userId The ID of the user.
   * @apiParam {Number} amount The amount to add.
   *
   * @apiSuccess {String} message Success message.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {get} /api/received-supplies Fetch received supplies
   * @apiName GetReceivedSupplies
   * @apiGroup Supplies
   *
   * @apiSuccess {Array} supplies The list of received supplies.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {get} /api/users/:userId Fetch user data, including shopping and search history
   * @apiName GetUserData
   * @apiGroup User
   *
   * @apiParam {Number} userId The ID of the user.
   *
   * @apiSuccess {Object} user The user data, including username, balance, shopping history, and search history.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {post} /api/search-history Add a search query to a user's search history
   * @apiName AddSearchHistory
   * @apiGroup Search
   *
   * @apiParam {Number} userId The ID of the user.
   * @apiParam {String} searchQuery The search query.
   *
   * @apiSuccess {String} message Success message.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {post} /api/request-supply Request supplies for a merchant
   * @apiName RequestSupply
   * @apiGroup Supplies
   *
   * @apiParam {Number} merchantId The ID of the merchant.
   * @apiParam {Number} productId The ID of the product.
   * @apiParam {Number} quantity The quantity of the product.
   *
   * @apiSuccess {Object} request The newly created supply request.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {get} /api/supply-requests Fetch pending supply requests
   * @apiName GetPendingSupplyRequests
   * @apiGroup Supplies
   *
   * @apiSuccess {Array} requests The list of pending supply requests.
   * @apiError {String} message Error message.
   */
  app.get("/api/supply-requests", async (req, res) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM supply_requests WHERE status = 'pending'"
      );
      res.json({ success: true, requests: result.rows });
    } catch (error) {
      console.error("Error fetching supply requests:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    } finally {
      client.release();
    }
  });

  /**
   * @api {post} /api/add-supply-by-id Add supply stock by supply ID
   * @apiName AddSupplyById
   * @apiGroup Supplies
   *
   * @apiParam {Number} id The ID of the supply.
   * @apiParam {Number} quantity The quantity to add to the supply.
   *
   * @apiSuccess {String} message Success message.
   * @apiError {String} message Error message.
   */
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

  /**
   * @api {post} /api/fulfill-supply-request Fulfill a supply request
   * @apiName FulfillSupplyRequest
   * @apiGroup Supplies
   *
   * @apiParam {Number} supplierId The ID of the supplier.
   * @apiParam {Number} merchantId The ID of the merchant.
   * @apiParam {Number} productId The ID of the product.
   * @apiParam {Number} quantity The quantity of the product.
   *
   * @apiSuccess {String} message Success message.
   * @apiError {String} message Error message.
   */
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

  /**
   * Generate a JWT token for a user.
   * @param {number} userId - The ID of the user.
   * @returns {string} The generated JWT token.
   */
  function generateToken(userId) {
    const secretKey = "your_secret_key";
    return jwt.sign({ userId }, secretKey, { expiresIn: "1h" });
  }
}
