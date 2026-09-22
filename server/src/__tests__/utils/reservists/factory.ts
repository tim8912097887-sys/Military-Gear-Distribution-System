import { randomUUID } from 'node:crypto';
import type { reservists } from '../../../infrastructure/db/schema/reservists.js';

export type ReservistRow = typeof reservists.$inferSelect;
export type ReservistInsert = typeof reservists.$inferInsert;

const RANKS = ['Private', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain'] as const;

export const DEFAULT_CREATED_AT = new Date('2024-01-15T08:30:00.000Z');
export const DEFAULT_CHECKED_IN_AT = new Date('2024-02-01T10:00:00.000Z');

let sequence = 0;

/**
 * Builds a reservist row that has not checked in yet.
 * Every call yields a unique id and nationalId.
 */
export function buildReservist(overrides: Partial<ReservistInsert> = {}): ReservistInsert {
  sequence += 1;

  return {
    id: randomUUID(),
    nationalId: `A${String(100000000 + sequence)}`,
    name: `Reservist ${String(sequence).padStart(6, '0')}`,
    militaryRank: RANKS[sequence % RANKS.length] ?? 'Private',
    createdAt: DEFAULT_CREATED_AT,
    checkedInAt: null,
    ...overrides,
  } as ReservistInsert;
}

export function buildCheckedInReservist(overrides: Partial<ReservistInsert> = {}): ReservistInsert {
  return buildReservist({ checkedInAt: DEFAULT_CHECKED_IN_AT, ...overrides });
}

export function buildReservists(
  count: number,
  overrides: Partial<ReservistInsert> = {},
): ReservistInsert[] {
  return Array.from({ length: count }, () => buildReservist(overrides));
}

export function buildCheckedInReservists(
  count: number,
  overrides: Partial<ReservistInsert> = {},
): ReservistInsert[] {
  return Array.from({ length: count }, () => buildCheckedInReservist(overrides));
}

/** A syntactically valid id that no seeded reservist has. */
export function unknownReservistId(): string {
  return randomUUID();
}

/** The response contract of a reservist (mirrors ReservistView). */
export function toExpectedView(row: ReservistRow): {
  id: string;
  nationalId: string;
  name: string;
  militaryRank: string;
  checkedInAt: string | null;
  createdAt: string;
} {
  return {
    id: row.id,
    nationalId: row.nationalId,
    name: row.name,
    militaryRank: row.militaryRank as string,
    checkedInAt: row.checkedInAt ? row.checkedInAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}
