import { sql } from 'drizzle-orm';
import { check, integer, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { gearCategories } from './gear-categories.js';

export const inventoryItems = pgTable(
  'inventory_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => gearCategories.id, { onDelete: 'restrict' }),
    size: varchar('size', { length: 20 }),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('stock_non_negative', sql`${t.stockQuantity} >= 0`),
    // Drizzle cannot express NULLS NOT DISTINCT yet; the migration does.
    unique('inventory_items_category_size_key').on(t.categoryId, t.size),
  ],
);

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
