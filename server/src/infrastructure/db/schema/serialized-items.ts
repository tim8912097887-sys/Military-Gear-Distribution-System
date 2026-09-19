import { sql } from 'drizzle-orm';
import { check, index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { type SerializedStatus } from './enums.js';
import { gearCategories } from './gear-categories.js';

export const serializedItems = pgTable(
  'serialized_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => gearCategories.id, { onDelete: 'restrict' }),
    serialNumber: varchar('serial_number', { length: 100 }).notNull().unique(),
    size: varchar('size', { length: 20 }),
    status: varchar('status', { length: 20 })
      .$type<SerializedStatus>()
      .notNull()
      .default('AVAILABLE'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      'serialized_item_status_check',
      sql`${t.status} IN ('AVAILABLE', 'ISSUED', 'MAINTENANCE', 'LOST')`,
    ),
    index('idx_serialized_category_status_size').on(t.categoryId, t.status, t.size),
  ],
);

export type SerializedItem = typeof serializedItems.$inferSelect;
export type NewSerializedItem = typeof serializedItems.$inferInsert;
