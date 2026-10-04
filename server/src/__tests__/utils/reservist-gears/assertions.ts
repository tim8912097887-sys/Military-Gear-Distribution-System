import type { Response } from 'supertest';
import { expect } from 'vitest';

export function expectNoInternalDetailsLeaked(res: Response): void {
  const serialized = JSON.stringify(res.body).toLowerCase();
  expect(serialized).not.toContain('reservists');
  expect(serialized).not.toContain('gear_categories');
  expect(serialized).not.toContain('relation');
  expect(serialized).not.toContain('select ');
}
