import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be set to run integration tests');
}

// Safety guard: these helpers TRUNCATE tables, so never allow a non-test database.
const databaseName = new URL(connectionString).pathname.slice(1);
if (!/test/i.test(databaseName)) {
  throw new Error(
    `Refusing to run integration tests against database "${databaseName}". ` +
      'The database name must contain "test".',
  );
}

export const pool = new Pool({ connectionString, max: 2 });
export const testDb = drizzle(pool);
