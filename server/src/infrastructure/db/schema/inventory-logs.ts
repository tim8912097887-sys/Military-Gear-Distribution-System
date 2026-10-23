import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { inventoryItems } from './inventory-items.js';

export const inventoryLogs = pgTable(
  'inventory_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'restrict' }),
    actionType: varchar('action_type', { length: 20 }).notNull(),
    quantity: integer('quantity').notNull(),
    performBy: varchar('perform_by', { length: 100 }).notNull(),
    reason: varchar('reason', { length: 30 }).notNull(),
    note: varchar('note', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('inventory_logs_action_type_check', sql`${t.actionType} IN ('INCREASE', 'DECREASE')`),
    check(
      'inventory_logs_reason_check',
      sql`${t.reason} IN ('RECEIVED', 'LOST', 'DAMAGED', 'COUNT_CORRECTION')`,
    ),
    check('inventory_logs_quantity_positive', sql`${t.quantity} > 0`),
    index('idx_inventory_logs_item_created').on(t.inventoryItemId, t.createdAt.desc()),
  ],
);

export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type NewInventoryLog = typeof inventoryLogs.$inferInsert;
