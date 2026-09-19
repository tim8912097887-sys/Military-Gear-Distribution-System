import { sql } from 'drizzle-orm';
import { check, index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { reservists } from './reservists.js';
import { serializedItems } from './serialized-items.js';

export const reservistSerializedGear = pgTable(
  'reservist_serialized_gear',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reservistId: uuid('reservist_id')
      .notNull()
      .references(() => reservists.id, { onDelete: 'restrict' }),
    serializedItemId: uuid('serialized_item_id')
      .notNull()
      .references(() => serializedItems.id, { onDelete: 'restrict' }),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    returnedAt: timestamp('returned_at', { withTimezone: true }),
  },
  (t) => [
    check(
      'returned_after_issued',
      sql`${t.returnedAt} IS NULL OR ${t.returnedAt} >= ${t.issuedAt}`,
    ),
    index('idx_serialized_gear_reservist').on(t.reservistId),
    uniqueIndex('uq_active_serialized_item')
      .on(t.serializedItemId)
      .where(sql`${t.returnedAt} IS NULL`),
    index('idx_serialized_gear_open_by_reservist')
      .on(t.reservistId, t.serializedItemId)
      .where(sql`${t.returnedAt} IS NULL`),
  ],
);

export type SerializedCustody = typeof reservistSerializedGear.$inferSelect;
export type NewSerializedCustody = typeof reservistSerializedGear.$inferInsert;
