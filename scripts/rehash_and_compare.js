const bcrypt = require('bcryptjs');

const password = 'shopper1';
const storedHash = '$2a$10$iKur9MMIKXiWclsbh7QPmeID2LypDQOeKftAW7E.4aCSp.fPup6sC'; // Hash from your DB

async function rehashAndCompare() {
  try {
    console.log('Password to compare:', password);
    console.log('Stored hash from database:', storedHash);

    // Hash the password again
    const newHash = await bcrypt.hash(password, 10);
    console.log('New hash for comparison:', newHash);

    // Compare the password with the stored hash
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log('Password matches:', isMatch);

    // Compare the newly generated hash with the stored hash
    const isNewHashMatch = newHash === storedHash;
    console.log('New hash matches stored hash:', isNewHashMatch);
  } catch (error) {
    console.error('Error in rehashing and comparison test:', error);
  }
}

rehashAndCompare();
