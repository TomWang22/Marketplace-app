const bcrypt = require('bcryptjs');

const password = 'shopper1';
const hashedPassword = '$2a$10$iKur9MMIKXiWclsbh7QPmeID2LypDQOeKftAW7E.4aCSp.fPup6sC'; // Hash from your DB

async function testBcrypt() {
  try {
    console.log('Password to compare:', password);
    console.log('Hash from database:', hashedPassword);

    // Compare the password with the existing hash
    const isMatch = await bcrypt.compare(password, hashedPassword);
    console.log('Password matches:', isMatch);
  } catch (error) {
    console.error('Error in bcrypt test:', error);
  }
}

testBcrypt();
