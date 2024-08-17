const { Pool } = require('pg');

// PostgreSQL connection setup
const pool = new Pool({
    user: 'postgres',
    host: '172.18.0.2', // Use the IP address directly
    database: 'marketplace',
    password: 'postgres',
    port: 5432,
});

// Sample reviews and usernames
const reviews = [
    "This product exceeded my expectations. High quality and great value.",
    "The product arrived on time and in perfect condition. Highly recommend.",
    "Good product but I had some issues with the installation.",
    "Works as expected, but I think it's a bit overpriced.",
    "Excellent product, I would buy it again!",
    "The product is decent, but I've seen better.",
    "Great customer service and the product quality is top-notch.",
    "Not satisfied with the product, it didn't meet my expectations.",
    "Fantastic! The product is exactly as described.",
    "I had some issues with the product, but the support team was very helpful.",
    "The product works as advertised, but it's not exceptional.",
    "It's a solid product, but it's not amazing.",
    "I'm happy with this product, but it's not extraordinary.",
    "It's a decent product, but it's not exceptional.",
    "I'm satisfied with this product, but it's not amazing.",
    "The product is fine, but it's not outstanding.",
    "It's a good product, but it's not without its flaws.",
    // Add more reviews here until you have 1600 unique entries...
];

const usernames = ['shopper1', 'shopper2'];

// Generate and insert reviews
const insertReviews = async () => {
    for (let i = 0; i < 1600; i++) {
        const productId = Math.floor(Math.random() * 16) + 1;  // Random product_id between 1 and 16
        const username = usernames[Math.floor(Math.random() * usernames.length)];
        const reviewText = reviews[Math.floor(Math.random() * reviews.length)];
        const rating = Math.floor(Math.random() * 5) + 1;  // Random rating between 1 and 5

        try {
            const result = await pool.query(
                'INSERT INTO reviews (product_id, username, text, rating, date) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
                [productId, username, reviewText, rating]
            );
            console.log(`Inserted review ${i + 1}:`, result.rows[0]);
        } catch (error) {
            console.error('Error inserting review:', error);
        }
    }

    console.log('All reviews inserted');
    await pool.end();  // Close the database connection after insertion
};

insertReviews();
