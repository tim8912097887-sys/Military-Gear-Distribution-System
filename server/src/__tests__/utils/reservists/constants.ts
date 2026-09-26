export const RESERVISTS_URL = '/api/v1/reservists';

export const reservistUrl = (id: string): string => `${RESERVISTS_URL}/${encodeURIComponent(id)}`;

export const checkInUrl = (id: string): string => `${reservistUrl(id)}/check-in`;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const LIST_LIMITS = {
  defaultLimit: 5,
  defaultCursor: null,
  minLimit: 1,
  maxLimit: 20,
} as const;

export const STATE = {
  SUCCESS: 'success',
  ERROR: 'error',
};
