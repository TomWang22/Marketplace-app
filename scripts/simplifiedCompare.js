const bcrypt = require('bcryptjs');

const password = 'shopper1';
const storedHash = '$2a$10$iKur9MMIKXiWclsbh7QPmeID2LypDQOeKftAW7E.4aCSp.fPup6sC'; // Hash from your DB

async function simplifiedCompare() {
  try {
    console.log('Password to compare:', password);
    console.log('Stored hash from database:', storedHash);

    // Compare the password with the stored hash
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log('Password matches stored hash:', isMatch);
  } catch (error) {
    console.error('Error in simplified comparison test:', error);
  }
}

simplifiedCompare();
