import { z } from 'zod';

const bulkLineSchema = z.object({
  inventoryItemId: z.uuid(),
  quantity: z.number().int().positive().max(100),
});

const serializedIssueLineSchema = z.object({
  serialNumber: z.string().trim().min(1).max(100),
});

export const RETURN_CONDITIONS = ['SERVICEABLE', 'DAMAGED', 'LOST'] as const;
export type ReturnCondition = (typeof RETURN_CONDITIONS)[number];

const serializedReturnLineSchema = z.object({
  serialNumber: z.string().trim().min(1).max(100),
  condition: z.enum(RETURN_CONDITIONS).default('SERVICEABLE'),
});

export const issueGearBodySchema = z
  .object({
    bulk: z.array(bulkLineSchema).max(50).default([]),
    serialized: z.array(serializedIssueLineSchema).max(50).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.bulk.length === 0 && value.serialized.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Request must contain at least one gear line',
      });
    }

    const serialNumbers = value.serialized.map((line) => line.serialNumber);

    if (new Set(serialNumbers).size !== serialNumbers.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['serialized'],
        message: 'Duplicate serial numbers are not allowed',
      });
    }
  });

export const returnGearBodySchema = z
  .object({
    bulk: z.array(bulkLineSchema).max(50).default([]),
    serialized: z.array(serializedReturnLineSchema).max(50).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.bulk.length === 0 && value.serialized.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Request must contain at least one gear line',
      });
    }

    const serialNumbers = value.serialized.map((line) => line.serialNumber);

    if (new Set(serialNumbers).size !== serialNumbers.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['serialized'],
        message: 'Duplicate serial numbers are not allowed',
      });
    }
  });

export const getGearQuerySchema = z.object({
  include: z
    .string()
    .optional()
    .transform(
      (v) =>
        new Set(
          (v ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        ),
    )
    .refine((set) => [...set].every((s) => s === 'history' || s === 'allowance'), {
      message: "include supports 'history' and 'allowance'",
    }),
  historyLimit: z.coerce.number().int().min(1).max(200).default(50),
});

export type IssueGearBody = z.infer<typeof issueGearBodySchema>;
export type ReturnGearBody = z.infer<typeof returnGearBodySchema>;
export type GetGearQuery = z.infer<typeof getGearQuerySchema>;
