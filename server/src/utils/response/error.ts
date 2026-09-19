import type { ErrorObject, ErrorResponse } from './base.js';

export const errorResponse = (error: ErrorObject): ErrorResponse => {
  return {
    state: 'error',
    error,
    data: null,
    meta: { timestamp: new Date().toISOString() },
  };
};
