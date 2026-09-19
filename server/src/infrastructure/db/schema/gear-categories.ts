import { sql } from 'drizzle-orm';
import { boolean, check, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { type TrackingType } from './enums.js';

export const gearCategories = pgTable(
  'gear_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    trackingType: varchar('tracking_type', { length: 20 }).$type<TrackingType>().notNull(),
    /** Ceiling counted across every size of the category. */
    maxPerReservist: integer('max_per_reservist').notNull(),
    requiresSize: boolean('requires_size').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('gear_tracking_type_check', sql`${t.trackingType} IN ('BULK', 'SERIALIZED')`),
    check('gear_max_per_reservist_positive', sql`${t.maxPerReservist} > 0`),
  ],
);

export type GearCategory = typeof gearCategories.$inferSelect;
export type NewGearCategory = typeof gearCategories.$inferInsert;
