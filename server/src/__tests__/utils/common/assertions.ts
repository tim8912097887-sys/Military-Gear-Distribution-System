import type { Response } from 'supertest';
import { expect } from 'vitest';

export function expectErrorResponse(res: Response, status: number): void {
  expect(res.status).toBe(status);
  expect(res.body.state).toBe('error');
  expect(res.body.data).toBe(null);
}
