import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { inventoryItems } from './inventory-items.js';
import { reservists } from './reservists.js';

export const reservistBulkGear = pgTable(
  'reservist_bulk_gear',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reservistId: uuid('reservist_id')
      .notNull()
      .references(() => reservists.id, { onDelete: 'restrict' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('positive_quantity', sql`${t.quantity} > 0`),
    unique('reservist_bulk_gear_unique').on(t.reservistId, t.inventoryItemId),
    index('idx_bulk_gear_reservist').on(t.reservistId),
    index('idx_bulk_gear_inventory_item').on(t.inventoryItemId),
  ],
);

export type BulkHolding = typeof reservistBulkGear.$inferSelect;
export type NewBulkHolding = typeof reservistBulkGear.$inferInsert;
