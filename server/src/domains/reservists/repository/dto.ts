import { z } from 'zod';
import type { Reservist } from '../../../infrastructure/db/schema/reservists.js';

export const listReservistsQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  checkedIn: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListReservistsResponse = {
  rows: Reservist[];
  total: number;
};

export type ListReservistsQuery = z.infer<typeof listReservistsQuerySchema>;
