import { eq } from 'drizzle-orm';
import type { ReservistInsert, ReservistRow } from './factory.js';
import { reservists } from '../../../infrastructure/db/schema/index.js';
import { pool, testDb } from '../common/db.js';
import { RESERVIST_TABLE_NAME } from './constants.js';

/** Removes every reservist (and rows referencing them) so each test starts clean. */
export async function truncateReservists(): Promise<void> {
  await pool.query(`TRUNCATE TABLE "${RESERVIST_TABLE_NAME}" RESTART IDENTITY CASCADE`);
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
    `SELECT count(*)::int AS count FROM "${RESERVIST_TABLE_NAME}"`,
  );
  return result.rows[0]?.count ?? 0;
}

export async function closeTestDb(): Promise<void> {
  await pool.end();
}
