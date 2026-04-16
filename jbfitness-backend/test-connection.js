import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

console.log('Testing connection to:', connectionString.replace(/:[^:]+@/, ':***@'));

const sql = postgres(connectionString, { ssl: 'require' });

try {
  const result = await sql`SELECT 1 as test`;
  console.log('✅ Connection successful:', result);
} catch (error) {
  console.error('❌ Connection failed:', error.message);
} finally {
  await sql.end();
}