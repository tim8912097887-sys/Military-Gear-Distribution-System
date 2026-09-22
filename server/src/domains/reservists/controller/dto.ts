import { z } from 'zod';

export const reservistIdParamsSchema = z.object({
  reservistId: z.uuid('reservistId must be a UUID'),
});

export const listReservistsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  checkedIn: z
    .preprocess(
      (val) => {
        if (val === 'true' || val === true) return 'true';
        if (val === 'false' || val === false) return 'false';
        return undefined;
      },
      z.enum(['true', 'false']).optional(),
    )
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListReservistsQuery = z.infer<typeof listReservistsQuerySchema>;
export type ReservistIdParams = z.infer<typeof reservistIdParamsSchema>;
