export const RESERVIST_CACHE_PREFIX = 'reservists';

export const RESERVIST_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;
export function getReservistCacheKey(reservistId: string): string {
  return `${RESERVIST_CACHE_PREFIX}:${reservistId}`;
}
