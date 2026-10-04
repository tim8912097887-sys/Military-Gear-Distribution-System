import { pool } from './db.js';

export async function withBrokenTable<T>(
  run: () => Promise<T>,
  tableNames: { TABLE_NAME: string; BROKEN_TABLE_NAME: string },
): Promise<T> {
  const { TABLE_NAME, BROKEN_TABLE_NAME } = tableNames;
  await pool.query(`ALTER TABLE "${TABLE_NAME}" RENAME TO "${BROKEN_TABLE_NAME}"`);
  try {
    return await run();
  } finally {
    await pool.query(`ALTER TABLE "${BROKEN_TABLE_NAME}" RENAME TO "${TABLE_NAME}"`);
  }
}
