export const RESERVISTS_URL = '/api/v1/reservists';

export const reservistUrl = (id: string): string => `${RESERVISTS_URL}/${encodeURIComponent(id)}`;

export const checkInUrl = (id: string): string => `${reservistUrl(id)}/check-in`;

export const LIST_LIMITS = {
  defaultLimit: 5,
  defaultCursor: null,
  minLimit: 1,
  maxLimit: 20,
} as const;

export const RESERVIST_TABLE_NAME = 'reservists';
export const RESERVIST_BROKEN_TABLE_NAME = `${RESERVIST_TABLE_NAME}_broken`;

export const RANKS = ['Private', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain'] as const;

export const DEFAULT_CREATED_AT = new Date('2024-01-15T08:30:00.000Z');
export const DEFAULT_CHECKED_IN_AT = new Date('2024-02-01T10:00:00.000Z');
