import { LIST_LIMITS } from './constants.js';

/** Raw query strings for GET /reservists that must fail validation. */
export const INVALID_LIST_QUERIES: string[] = [
  // limit
  'limit=0',
  'limit=-1',
  'limit=abc',
  'limit=1.5',
  'limit=',
  `limit=${LIST_LIMITS.maxLimit + 1}`,
  'limit=1&limit=2', // repeated param -> array
  // cursor
  'cursor=abc',
  'cursor=1',
  'cursor=123e4567-e89b-12d3-a456-42661417400Z',
  // q
  'q=a&q=b', // repeated param -> array
  // valid + invalid mixed: the invalid one must still fail the whole request
  'limit=10&cursor=123e4567-e89b-12d3-a456',
];
