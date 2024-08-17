// scripts/populateReviews.js

import pkg from 'pg';
import { faker } from '@faker-js/faker';

const { Pool } = pkg;

// PostgreSQL connection details
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',  // Update with your DB user
  host: 'localhost',  // Update if necessary
  database: process.env.POSTGRES_DB || 'marketplace',  // Update with your DB name
  password: process.env.POSTGRES_PASSWORD || 'password',  // Update with your DB password
  port: 5432
});

// Mock data generation
const numReviews = 150;
const shoppers = ['shopper1', 'shopper2'];
const ratings = [1, 2, 3, 4, 5];

async function insertMockReviews() {
  try {
    const client = await pool.connect();
    
    // Get product IDs
    const productResult = await client.query('SELECT id FROM products');
    const productIds = productResult.rows.map(row => row.id);
    
    // Insert reviews for each product
    for (const productId of productIds) {
      for (let i = 0; i < numReviews; i++) {
        const username = faker.helpers.arrayElement(shoppers);
        const text = faker.lorem.sentences(2);
        const rating = faker.helpers.arrayElement(ratings);
        const date = faker.date.past();

        await client.query(
          'INSERT INTO reviews (product_id, username, text, rating, date) VALUES ($1, $2, $3, $4, $5)',
          [productId, username, text, rating, date]
        );
      }
    }

    console.log(`Inserted ${numReviews * productIds.length} reviews`);
    client.release();
  } catch (err) {
    console.error('Error inserting mock reviews:', err);
  } finally {
    await pool.end();
  }
}

insertMockReviews();
