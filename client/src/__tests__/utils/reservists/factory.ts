import type {
  ListReservistsResponse,
  ReservistView,
} from "../../../features/reservists/types";
import { DEFAULT_CHECKED_IN_AT, DEFAULT_CREATED_AT } from "./constants";

const RANKS = [
  "Private",
  "Corporal",
  "Sergeant",
  "Lieutenant",
  "Captain",
] as const;

let sequence = 0;

/**
 * Builds a reservist row that has not checked in yet.
 * Every call yields a unique id and nationalId.
 */
export function buildReservist(
  overrides: Partial<ReservistView> = {},
): ReservistView {
  sequence += 1;

  return {
    id: crypto.randomUUID(),
    nationalId: `A${String(100000000 + sequence)}`,
    name: `Reservist ${String(sequence).padStart(6, "0")}`,
    militaryRank: RANKS[sequence % RANKS.length] ?? "Private",
    createdAt: DEFAULT_CREATED_AT,
    checkedInAt: null,
    ...overrides,
  } as ReservistView;
}

export function buildCheckedInReservist(
  overrides: Partial<ReservistView> = {},
): ReservistView {
  return buildReservist({ checkedInAt: DEFAULT_CHECKED_IN_AT, ...overrides });
}

export function buildReservists(
  count: number,
  overrides: Partial<ReservistView> = {},
): ReservistView[] {
  return Array.from({ length: count }, () => buildReservist(overrides));
}

export function buildCheckedInReservists(
  count: number,
  overrides: Partial<ReservistView> = {},
): ReservistView[] {
  return Array.from({ length: count }, () =>
    buildCheckedInReservist(overrides),
  );
}

/** A syntactically valid id that no seeded reservist has. */
export function unknownReservistId(): string {
  return crypto.randomUUID();
}

export function paginationResponse(
  reservists: ReservistView[],
  pagination: Partial<ListReservistsResponse["pagination"]>,
): ListReservistsResponse {
  return {
    reservists,
    pagination: {
      total: pagination.total ?? 0,
      limit: pagination.limit ?? 0,
      nextCursor: pagination.nextCursor ?? null,
      hasMore: pagination.hasMore ?? false,
    },
  };
}
