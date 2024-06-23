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
   * Register a new user.
   * @param {string} username - The username of the new user.
   * @param {string} password - The password of the new user.
   * @param {string} role - The role of the new user ('shopper', 'merchant', 'supplier').
   */
  app.post("/api/register", async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query("SELECT * FROM register_user($1, $2, $3, $4)", [username, hashedPassword, role, 50000]);
      const newUser = result.rows[0];
  
      res.json({ success: true, user: newUser });
    } catch (error) {
      if (error.code === "23505") {
        res.status(400).json({ success: false, message: "Username already exists" });
      } else {
        console.error("Error during registration:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  });
  
  /**
   * Login a user.
   * @param {string} username - The username of the user.
   * @param {string} password - The password of the user.
   */
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log(`Login attempt for username: ${username}`);

        const result = await pool.query("SELECT * FROM login_user($1)", [username]);
        const user = result.rows[0];

        if (user) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (isPasswordValid) {
                const token = generateToken(user.id);
                console.log(`Login successful for user ID: ${user.id}`);
                return res.json({ success: true, userId: user.id, role: user.role, token });
            }
        }
        res.status(401).json({ success: false, message: "Invalid credentials" });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

  /**
   * Fetch cart items for a user.
   * @param {number} userId - The ID of the user.
   */
  app.get("/api/cart", async (req, res) => {
    const userId = req.query.userId;
    try {
      const result = await pool.query("SELECT * FROM get_cart_items($1)", [userId]);
      res.json({ success: true, items: result.rows });
    } catch (error) {
      console.error("Error fetching cart items:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Place an order for a user.
   * @param {number} userId - The ID of the user.
   * @param {array} cartItems - The items in the user's cart.
   */
  app.post("/api/place-order", async (req, res) => {
    const { userId, cartItems } = req.body;
  
    if (!userId || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid order data." });
    }
  
    try {
      await pool.query("SELECT place_order($1, $2)", [userId, JSON.stringify(cartItems)]);
      res.json({ success: true, message: "Order placed successfully." });
    } catch (error) {
      console.error("Error placing order:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  });
  
  /**
   * Fetch inventory items for a user.
   * @param {number} userId - The ID of the user.
   */
  app.get("/api/inventory", async (req, res) => {
    const userId = req.query.userId;
    try {
      const result = await pool.query("SELECT * FROM get_inventory_items($1)", [userId]);
      res.json({ success: true, items: result.rows });
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Return merchandise for a user.
   * @param {number} userId - The ID of the user.
   * @param {number} productId - The ID of the product to be returned.
   * @param {number} quantity - The quantity of the product to be returned.
   */
  app.post("/api/return-merchandise", async (req, res) => {
    const { userId, productId, quantity } = req.body;
  
    try {
      await pool.query("SELECT return_merchandise($1, $2, $3)", [userId, productId, quantity]);
      res.json({ success: true, message: "Merchandise returned and refunded successfully." });
    } catch (error) {
      console.error("Error returning merchandise:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Receive supplies for a merchant.
   * @param {number} merchantId - The ID of the merchant.
   * @param {number} productId - The ID of the product.
   * @param {number} quantity - The quantity of the product.
   */
  app.post("/api/receive-supplies", async (req, res) => {
    const { merchantId, productId, quantity } = req.body;
  
    try {
      await pool.query("SELECT receive_supplies($1, $2, $3)", [merchantId, productId, quantity]);
      res.json({ success: true, message: "Supplies received successfully." });
    } catch (error) {
      console.error("Error receiving supplies:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Fulfill an order.
   * @param {number} orderId - The ID of the order.
   * @param {number} productId - The ID of the product in the order.
   * @param {number} quantity - The quantity of the product to fulfill.
   */
  app.post("/api/fulfill-order", async (req, res) => {
    const { orderId, productId, quantity } = req.body;
  
    if (!orderId || !productId || !quantity) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }
  
    try {
      await pool.query("SELECT fulfill_order($1, $2, $3)", [orderId, productId, quantity]);
      res.json({ success: true, message: "Order fulfilled successfully." });
    } catch (error) {
      console.error("Error fulfilling order:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  });
  
  /**
   * Fetch unfulfilled orders.
   */
  app.get("/api/unfulfilled-orders", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM get_unfulfilled_orders()");
      res.json({ success: true, orders: result.rows });
    } catch (error) {
      console.error("Error fetching unfulfilled orders:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Fetch all products.
   */
  app.get("/api/products", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM get_all_products()");
      res.json({ success: true, products: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Add a new product.
   * @param {string} name - The name of the product.
   * @param {string} description - The description of the product.
   * @param {number} price - The price of the product.
   * @param {number} stock - The stock quantity of the product.
   * @param {string} image_url - The image URL of the product.
   */
  app.post("/api/products", async (req, res) => {
    const { name, description, price, stock, image_url } = req.body;
    try {
      const result = await pool.query(
        "SELECT * FROM add_product($1, $2, $3, $4, $5)",
        [name, description, price, stock, image_url]
      );
      res.json({ success: true, product: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Fetch purchased items.
   */
  app.get("/api/purchased-items", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM get_purchased_items()");
      res.json({ success: true, items: result.rows });
    } catch (error) {
      console.error("Error fetching purchased items:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Fetch account information for a user.
   * @param {number} userId - The ID of the user.
   */
  app.get("/api/account-info", async (req, res) => {
    const userId = req.query.userId;
    try {
      const result = await pool.query("SELECT * FROM get_account_info($1)", [userId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({ success: true, account: result.rows[0] });
    } catch (error) {
      console.error("Error fetching account info:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Fetch purchase history for a user.
   * @param {number} userId - The ID of the user.
   */
  app.get("/api/purchase-history", async (req, res) => {
    const userId = req.query.userId;
    try {
      const result = await pool.query("SELECT * FROM get_purchase_history($1)", [userId]);
      res.json({ success: true, history: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Add an item to the cart.
   * @param {number} userId - The ID of the user.
   * @param {number} productId - The ID of the product.
   * @param {number} quantity - The quantity of the product.
   */
  app.post("/api/cart", async (req, res) => {
    const { userId, productId, quantity } = req.body;
  
    if (!userId || !productId || !quantity) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }
  
    try {
      const result = await pool.query(
        "SELECT * FROM add_to_cart($1, $2, $3)",
        [userId, productId, quantity]
      );
      res.json({ success: true, item: result.rows[0] });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Update the quantity of an item in the cart.
   * @param {number} itemId - The ID of the cart item.
   * @param {number} quantity - The new quantity of the item.
   */
  app.put("/api/cart/:id", async (req, res) => {
    const itemId = req.params.id;
    const { quantity } = req.body;
  
    try {
      await pool.query("SELECT update_cart_item($1, $2)", [itemId, quantity]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Remove an item from the cart.
   * @param {number} itemId - The ID of the cart item.
   */
  app.delete("/api/cart/:id", async (req, res) => {
    const itemId = req.params.id;
  
    try {
      await pool.query("SELECT remove_from_cart($1)", [itemId]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Add funds to a user's account.
   * @param {number} userId - The ID of the user.
   * @param {number} amount - The amount to add.
   */
  app.post("/api/add-funds", async (req, res) => {
    const { userId, amount } = req.body;
  
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than zero" });
    }
  
    try {
      await pool.query("SELECT add_funds($1, $2)", [userId, amount]);
      res.json({ success: true, message: "Funds added successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Fetch received supplies.
   */
  app.get("/api/received-supplies", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM get_received_supplies()");
      res.json({ success: true, supplies: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Fetch user data, including shopping and search history.
   * @param {number} userId - The ID of the user.
   */
  app.get("/api/users/:userId", async (req, res) => {
    const userId = req.params.userId;
  
    try {
      const result = await pool.query("SELECT * FROM get_user_data($1)", [userId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({ success: true, user: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Add a search query to a user's search history.
   * @param {number} userId - The ID of the user.
   * @param {string} searchQuery - The search query.
   */
  app.post("/api/search-history", async (req, res) => {
    const { userId, searchQuery } = req.body;
    try {
      await pool.query("CALL add_search_query($1, $2)", [userId, searchQuery]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Request supplies for a merchant.
   * @param {number} merchantId - The ID of the merchant.
   * @param {number} productId - The ID of the product.
   * @param {number} quantity - The quantity of the product.
   */
  app.post("/api/request-supply", async (req, res) => {
    const { merchantId, productId, quantity } = req.body;
    try {
      const result = await pool.query("SELECT * FROM request_supply($1, $2, $3)", [merchantId, productId, quantity]);
      res.json({ success: true, request: result.rows[0] });
    } catch (error) {
      console.error("Error requesting supply:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  /**
   * Fetch pending supply requests.
   */
  app.get("/api/supply-requests", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM get_pending_supply_requests()");
      res.json({ success: true, requests: result.rows });
    } catch (error) {
      console.error("Error fetching supply requests:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  });
  
  /**
   * Send supplies from a supplier to a merchant.
   * @param {number} supplierId - The ID of the supplier.
   * @param {number} merchantId - The ID of the merchant.
   * @param {number} productId - The ID of the product.
   * @param {number} quantity - The quantity of the product.
   */
  app.post("/api/send-supplies", async (req, res) => {
    const { supplierId, merchantId, productId, quantity } = req.body;
  
    if (!supplierId || !merchantId || !productId || !quantity) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }
  
    try {
      const result = await pool.query("SELECT * FROM send_supplies($1, $2, $3, $4)", [supplierId, merchantId, productId, quantity]);
      const newSupply = result.rows[0];
      io.emit("newSupply", newSupply);
      res.json({ success: true, message: `Sent ${quantity} units of product ID ${productId} to merchant ID ${merchantId}` });
    } catch (error) {
      console.error("Error sending supplies:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  });
  

  server.listen(port, () => {
    console.log(`Worker ${process.pid} is running on http://localhost:${port}`);
  });

  /**
   * Fetch all supplies.
   */
  app.get("/api/supplies", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM get_supplies()");
      res.json({ success: true, supplies: result.rows });
    } catch (error) {
      console.error("Error fetching supplies:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  /*
  app.get("/api/supply-requests", async (req, res) => {
    const client = await pool.connect();
    try {
      const result = await client.query(`
            SELECT sr.id, sr.merchant_id, sr.product_id, sr.quantity, sr.request_date, sr.status, p.name
            FROM supply_requests sr
            JOIN products p ON sr.product_id = p.id
            WHERE sr.status = 'pending'
        `);

      // Log the raw SQL result
      console.log("Raw SQL Query Result:", result.rows);

      const requests = result.rows.map((row) => ({
        id: row.id,
        merchant_id: row.merchant_id,
        product_id: row.product_id,
        quantity: row.quantity,
        request_date: row.request_date,
        status: row.status,
        name: row.name || "Unknown", // Default to 'Unknown' if name is null or undefined
      }));

      // Log the constructed response
      console.log("Constructed Response:", requests);

      res.json({
        success: true,
        requests: requests,
      });
    } catch (error) {
      console.error("Error fetching supply requests:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    } finally {
      client.release();
    }
  });
  /*

  /**
   * Add supply stock by supply ID.
   * @param {number} id - The ID of the supply.
   * @param {number} quantity - The quantity to add to the supply.
   */
  app.post("/api/add-supply-by-id", async (req, res) => {
    const { id, quantity } = req.body;
  
    if (!id || !quantity) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }
  
    try {
      await pool.query("CALL add_supply_by_id($1, $2)", [id, quantity]);
      res.json({ success: true, message: `Added ${quantity} units to supply ID ${id}.` });
    } catch (error) {
      console.error("Error adding supply by ID:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  });
  
  /**
   * Fulfill a supply request.
   * @param {number} supplierId - The ID of the supplier.
   * @param {number} merchantId - The ID of the merchant.
   * @param {number} productId - The ID of the product.
   * @param {number} quantity - The quantity of the product.
   */
  app.post("/api/fulfill-supply-request", async (req, res) => {
    const { supplierId, merchantId, productId, quantity } = req.body;
  
    if (!supplierId || !merchantId || !productId || !quantity) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }
  
    try {
      await pool.query("CALL fulfill_supply_request($1, $2, $3, $4)", [supplierId, merchantId, productId, quantity]);
      res.json({ success: true, message: `Sent ${quantity} units of product ID ${productId} to merchant ID ${merchantId}` });
    } catch (error) {
      console.error("Error fulfilling supply request:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
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
