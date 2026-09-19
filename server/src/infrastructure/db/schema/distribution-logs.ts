import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { type ActionType } from './enums.js';
import { inventoryItems } from './inventory-items.js';
import { reservists } from './reservists.js';
import { serializedItems } from './serialized-items.js';

export const distributionLogs = pgTable(
  'distribution_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reservistId: uuid('reservist_id')
      .notNull()
      .references(() => reservists.id, { onDelete: 'restrict' }),
    inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id, {
      onDelete: 'restrict',
    }),
    serializedItemId: uuid('serialized_item_id').references(() => serializedItems.id, {
      onDelete: 'restrict',
    }),
    actionType: varchar('action_type', { length: 20 }).$type<ActionType>().notNull(),
    quantity: integer('quantity'),
    requestId: uuid('request_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('distribution_action_check', sql`${t.actionType} IN ('ISSUE', 'RETURN')`),
    check(
      'distribution_logs_target_check',
      sql`(${t.inventoryItemId} IS NOT NULL AND ${t.serializedItemId} IS NULL AND ${t.quantity} IS NOT NULL AND ${t.quantity} > 0)
          OR (${t.inventoryItemId} IS NULL AND ${t.serializedItemId} IS NOT NULL AND ${t.quantity} IS NULL)`,
    ),
    index('idx_distribution_logs_reservist_created').on(t.reservistId, t.createdAt.desc()),
  ],
);

export type DistributionLog = typeof distributionLogs.$inferSelect;
export type NewDistributionLog = typeof distributionLogs.$inferInsert;
