const bcrypt = require('bcryptjs');

const password = 'shopper1';
const storedHash = '$2a$10$iKur9MMIKXiWclsbh7QPmeID2LypDQOeKftAW7E.4aCSp.fPup6sC'; // Hash from your DB

async function detailedRehashAndCompare() {
  try {
    console.log('Password to compare:', password);
    console.log('Stored hash from database:', storedHash);

    // Generate a new hash for the password
    const newHash = await bcrypt.hash(password, 10);
    console.log('New hash for comparison:', newHash);

    // Compare the password with the stored hash
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log('Password matches stored hash:', isMatch);

    // Log details of the bcrypt comparison
    const hashParts = storedHash.split('$');
    const newHashParts = newHash.split('$');
    console.log('Stored hash parts:', hashParts);
    console.log('New hash parts:', newHashParts);

    // Check if the salts match
    const saltsMatch = hashParts[3] === newHashParts[3];
    console.log('Salts match:', saltsMatch);

    // Compare the newly generated hash with the stored hash directly
    const isNewHashMatch = newHash === storedHash;
    console.log('New hash matches stored hash directly:', isNewHashMatch);
  } catch (error) {
    console.error('Error in detailed rehashing and comparison test:', error);
  }
}

detailedRehashAndCompare();
