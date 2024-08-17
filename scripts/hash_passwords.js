const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'marketplace',
  port: 5432,
  password: 'postgres',
});

async function hashPasswords() {
  try {
    const users = await pool.query('SELECT id, username, password FROM users');
    for (let user of users.rows) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
      console.log(`Password for user ${user.username} (ID ${user.id}) has been hashed.`);
    }
    console.log('All passwords have been hashed successfully.');
  } catch (error) {
    console.error('Error hashing passwords:', error);
  } finally {
    await pool.end();
  }
}

hashPasswords();
