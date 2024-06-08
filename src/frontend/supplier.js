// Import necessary modules for HTTP requests
const fetch = require('node-fetch');
const { Pool } = require('pg');

// Create a PostgreSQL pool
const pool = new Pool({
    user: 'your_username',
    host: 'localhost',
    database: 'your_database',
    password: 'your_password',
    port: 5432,
});

// Function to add a product to the products table and deduct the cost from the supplier's balance
async function addProduct(name, description, price, cost, stock) {
    try {
        const client = await pool.connect();
        try {
            // Add the product to the products table
            const productQuery = 'INSERT INTO products (name, description, price, cost, stock) VALUES ($1, $2, $3, $4, $5) RETURNING *';
            const productValues = [name, description, price, cost, stock];
            const productResult = await client.query(productQuery, productValues);
            const product = productResult.rows[0];

            console.log('Product added:', product);
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
    }
}

// Function to handle request from the merchant and supply products
async function handleRequestFromMerchant(request) {
    try {
        // Process the request and supply products accordingly
        // Update inventory or stock levels, handle transactions, etc.
        console.log('Received request from merchant:', request);

        // Example: Deduct cost from the supplier's balance
        const supplierId = request.supplierId; // Assuming you have a way to identify the supplier
        const cost = calculateCost(request.productId, request.quantity); // Implement your logic to calculate cost
        await deductFromSupplierBalance(cost, supplierId);

        console.log('Transaction completed.');
    } catch (error) {
        console.error('Error handling request from merchant:', error);
    }
}

// Function to deduct cost from the supplier's balance
async function deductFromSupplierBalance(cost, supplierId) {
    try {
        const client = await pool.connect();
        try {
            const balanceQuery = 'UPDATE suppliers SET balance = balance - $1 WHERE id = $2';
            const balanceValues = [cost, supplierId];
            await client.query(balanceQuery, balanceValues);
        } catch (error) {
            console.error('Error deducting from supplier balance:', error);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
    }
}

handleRequestFromMerchant(requestFromMerchant);