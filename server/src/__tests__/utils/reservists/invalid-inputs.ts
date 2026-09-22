import { LIST_LIMITS } from './constants.js';

/** Values that are not valid reservist ids (raw, they get URL-encoded by the url helpers). */
export const INVALID_RESERVIST_IDS: string[] = [
  'abc',
  '12345',
  'not-a-uuid',
  ' ',
  'null',
  'undefined',
  '123e4567-e89b-12d3-a456-42661417400', // one char too short
  '123e4567-e89b-12d3-a456-4266141740000', // one char too long
  '123e4567-e89b-12d3-a456-42661417400Z', // non-hex character
  "1' OR '1'='1", // SQL injection attempt
  '<script>alert(1)</script>',
  'a'.repeat(300),
];

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
  // offset
  'offset=-1',
  'offset=abc',
  'offset=1.5',
  'offset=1&offset=2',
  // q
  'q=a&q=b', // repeated param -> array
  // valid + invalid mixed: the invalid one must still fail the whole request
  'limit=10&offset=-1',
];
