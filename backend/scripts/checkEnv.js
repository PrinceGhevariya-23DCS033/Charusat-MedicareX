const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('Checking environment variables...');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Found ✓' : 'Missing ✗');
console.log('PORT:', process.env.PORT ? 'Found ✓' : 'Missing ✗');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Found ✓' : 'Missing ✗');

if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in environment variables');
  process.exit(1);
} 