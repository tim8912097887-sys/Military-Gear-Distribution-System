import { sql } from 'drizzle-orm';
import { check, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const reservists = pgTable(
  'reservists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nationalId: varchar('national_id', { length: 10 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    militaryRank: varchar('military_rank', { length: 50 }),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check('reservists_national_id_format', sql`${t.nationalId} ~ '^[A-Z][0-9A-D][0-9]{8}$'`)],
);

export type Reservist = typeof reservists.$inferSelect;
export type NewReservist = typeof reservists.$inferInsert;
