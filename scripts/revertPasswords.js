const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'marketplace',
  port: 5432,
  password: 'postgres',
});

// Original plain text passwords
const plainTextPasswords = [
  { username: 'shopper1', password: 'shopper1' },
  { username: 'shopper2', password: 'shopper2' },
  { username: 'supplier1', password: 'supplier1' },
  { username: 'supplier2', password: 'supplier2' },
  { username: 'merchant1', password: 'merchant1' },
  { username: 'merchant2', password: 'merchant2' },
];

async function revertPasswords() {
  try {
    for (let user of plainTextPasswords) {
      await pool.query('UPDATE users SET password = $1 WHERE username = $2', [user.password, user.username]);
      console.log(`Password for user ${user.username} has been reverted to plain text.`);
    }
    console.log('All passwords have been reverted to plain text successfully.');
  } catch (error) {
    console.error('Error reverting passwords:', error);
  } finally {
    await pool.end();
  }
}

revertPasswords();
