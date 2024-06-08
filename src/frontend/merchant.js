// merchant.js

// Import necessary modules for database interaction
const { Pool } = require('pg');

// Create a new Pool instance to connect to your PostgreSQL database
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'marketplace',
    port: 5432 // Default PostgreSQL port
});

// Function to add a new product to the inventory
async function addProduct(name, description, price, stock) {
    try {
        const query = 'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *';
        const values = [name, description, price, stock];
        const result = await pool.query(query, values);
        console.log('Product added:', result.rows[0]);
    } catch (error) {
        console.error('Error adding product:', error);
    }
}

// Function to update an existing product in the inventory
async function updateProduct(productId, updatedFields) {
    try {
        const query = 'UPDATE products SET name = $1, description = $2, price = $3, stock = $4 WHERE id = $5 RETURNING *';
        const values = [updatedFields.name, updatedFields.description, updatedFields.price, updatedFields.stock, productId];
        const result = await pool.query(query, values);
        console.log('Product updated:', result.rows[0]);
    } catch (error) {
        console.error('Error updating product:', error);
    }
}

// Function to delete a product from the inventory
async function deleteProduct(productId) {
    try {
        const query = 'DELETE FROM products WHERE id = $1';
        const values = [productId];
        await pool.query(query, values);
        console.log('Product deleted:', productId);
    } catch (error) {
        console.error('Error deleting product:', error);
    }
}

// Example usage:
// Add a new product to the inventory
addProduct('Product A', 'Description of Product A', 19.99, 50);

// Update an existing product in the inventory
updateProduct(1, { name: 'Updated Product A', description: 'Updated description', price: 29.99, stock: 100 });

// Delete a product from the inventory
deleteProduct(1);
