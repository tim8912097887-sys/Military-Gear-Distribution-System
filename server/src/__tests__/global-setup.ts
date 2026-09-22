import dotenv from 'dotenv';

// Vitest expects a default export that is a FUNCTION
export default function setup() {
  dotenv.config({ path: '.env' });
  console.log('Test environment variables loaded.');
}
