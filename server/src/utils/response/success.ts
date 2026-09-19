import type { SuccessResponse } from './base.js';

export const successResponse = (data: any): SuccessResponse => {
  return {
    state: 'success',
    error: null,
    data: data,
    meta: { timestamp: new Date().toISOString() },
  };
};
