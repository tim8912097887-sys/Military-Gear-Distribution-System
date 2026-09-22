import type { Response } from 'supertest';
import { expect } from 'vitest';

export function expectErrorResponse(res: Response, status: number): void {
  expect(res.status).toBe(status);
  expect(res.body.data).toBe(null);
}

/** A 500 must not leak SQL / table details to the client. */
export function expectNoInternalDetailsLeaked(res: Response): void {
  const serialized = JSON.stringify(res.body).toLowerCase();
  expect(serialized).not.toContain('reservists');
  expect(serialized).not.toContain('relation');
  expect(serialized).not.toContain('select ');
}

/** Asserts `iso` is a valid ISO-8601 string falling between two epoch-ms bounds. */
export function expectIsoTimestampBetween(
  iso: unknown,
  fromMs: number,
  toMs: number,
  toleranceMs = 1000,
): void {
  expect(typeof iso).toBe('string');
  const value = new Date(iso as string);
  expect(Number.isNaN(value.getTime())).toBe(false);
  expect(value.toISOString()).toBe(iso);
  expect(value.getTime()).toBeGreaterThanOrEqual(fromMs - toleranceMs);
  expect(value.getTime()).toBeLessThanOrEqual(toMs + toleranceMs);
}

export function namesOf(res: Response): string[] {
  return res.body.data.reservists.map((r: { name: string }) => r.name);
}

export function idsOf(res: Response): string[] {
  return res.body.data.reservists.map((r: { id: string }) => r.id);
}
