import type { SuccessResponse } from './base.js';

export const successResponse = <T>(data: T): SuccessResponse<T> => {
  return {
    state: 'success',
    error: null,
    data,
    meta: { timestamp: new Date().toISOString() },
  };
};
