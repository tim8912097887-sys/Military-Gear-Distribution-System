import { eq, getTableName } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { ReservistInsert, ReservistRow } from './factory.js';
import { reservists } from '../../../infrastructure/db/schema/index.js';

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

const TABLE_NAME = getTableName(reservists);
const BROKEN_TABLE_NAME = `${TABLE_NAME}__broken`;

const pool = new Pool({ connectionString, max: 2 });
export const testDb = drizzle(pool);

/** Removes every reservist (and rows referencing them) so each test starts clean. */
export async function truncateReservists(): Promise<void> {
  await pool.query(`TRUNCATE TABLE "${TABLE_NAME}" RESTART IDENTITY CASCADE`);
}

export async function seedReservist(row: ReservistInsert): Promise<ReservistRow> {
  const [inserted] = await testDb.insert(reservists).values(row).returning();
  if (!inserted) {
    throw new Error('Failed to seed reservist');
  }
  return inserted;
}

export async function seedReservists(rows: ReservistInsert[]): Promise<ReservistRow[]> {
  if (rows.length === 0) {
    return [];
  }
  return testDb.insert(reservists).values(rows).returning();
}

export async function findReservistRow(id: string): Promise<ReservistRow | undefined> {
  const [row] = await testDb.select().from(reservists).where(eq(reservists.id, id)).limit(1);
  return row;
}

export async function countReservists(): Promise<number> {
  const result = await pool.query<{ count: number }>(
    `SELECT count(*)::int AS count FROM "${TABLE_NAME}"`,
  );
  return result.rows[0]?.count ?? 0;
}

/**
 * Produces a REAL database failure (no mocks): the reservists table is renamed so every
 * query issued by the repository fails with "relation does not exist".
 * The table (and its data) is always restored, even if `run` throws.
 *
 * NOTE: needs `fileParallelism: false` in the vitest config, otherwise other test files
 * could hit the renamed table.
 */
export async function withBrokenReservistsTable<T>(run: () => Promise<T>): Promise<T> {
  await pool.query(`ALTER TABLE "${TABLE_NAME}" RENAME TO "${BROKEN_TABLE_NAME}"`);
  try {
    return await run();
  } finally {
    await pool.query(`ALTER TABLE "${BROKEN_TABLE_NAME}" RENAME TO "${TABLE_NAME}"`);
  }
}

export async function closeTestDb(): Promise<void> {
  await pool.end();
}
