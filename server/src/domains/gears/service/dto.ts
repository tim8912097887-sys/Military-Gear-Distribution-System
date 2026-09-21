import { z } from 'zod';
import type { SerializedStatus } from '../../../infrastructure/db/schema/enums.js';
import type { GearCategory } from '../../../infrastructure/db/schema/gear-categories.js';

export interface ResolvedBulkLine {
  inventoryItemId: string;
  category: GearCategory;
  size: string | null;
  quantity: number;
}

interface IssuedBulkResult {
  inventoryItemId: string;
  categoryId: string;
  categoryName: string;
  size: string | null;
  quantity: number;
  remainingStock: number;
  totalHeld: number;
}

interface IssuedSerializedResult {
  custodyId: string;
  serializedItemId: string;
  serialNumber: string;
  categoryId: string;
  categoryName: string;
  size: string | null;
}

interface ReturnedBulkResult {
  inventoryItemId: string;
  categoryId: string;
  categoryName: string;
  size: string | null;
  quantity: number;
  remainingHeld: number;
  restockedTo: number;
}

interface ReturnedSerializedResult {
  serializedItemId: string;
  serialNumber: string;
  categoryId: string;
  categoryName: string;
  size: string | null;
  condition: ReturnCondition;
  newStatus: SerializedStatus;
}

export interface IssueGearResult {
  reservistId: string;
  requestId: string | null;
  issued: { bulk: IssuedBulkResult[]; serialized: IssuedSerializedResult[] };
}

export interface ReturnGearResult {
  reservistId: string;
  requestId: string | null;
  returned: { bulk: ReturnedBulkResult[]; serialized: ReturnedSerializedResult[] };
}

export const CONDITION_TO_STATUS: Record<ReturnCondition, SerializedStatus> = {
  SERVICEABLE: 'AVAILABLE',
  DAMAGED: 'MAINTENANCE',
  LOST: 'LOST',
};

const bulkLineSchema = z.object({
  inventoryItemId: z.uuid(),
  quantity: z.number().int().positive().max(100),
});

const serializedIssueLineSchema = z.object({
  serialNumber: z.string().trim().min(1).max(100),
});

export const RETURN_CONDITIONS = ['SERVICEABLE', 'DAMAGED', 'LOST'] as const;
export type ReturnCondition = (typeof RETURN_CONDITIONS)[number];

const serializedReturnLineSchema = z
  .object({
    serializedItemId: z.uuid().optional(),
    serialNumber: z.string().trim().min(1).max(100).optional(),
    condition: z.enum(RETURN_CONDITIONS).default('SERVICEABLE'),
  })
  .refine((v) => Boolean(v.serializedItemId) || Boolean(v.serialNumber), {
    message: 'Provide serializedItemId or serialNumber',
  });

const nonEmptyPayload = <T extends { bulk?: unknown[]; serialized?: unknown[] }>(v: T) =>
  (v.bulk?.length ?? 0) + (v.serialized?.length ?? 0) > 0;

export const issueGearBodySchema = z
  .object({
    bulk: z.array(bulkLineSchema).max(50).default([]),
    serialized: z.array(serializedIssueLineSchema).max(50).default([]),
  })
  .refine(nonEmptyPayload, { message: 'Request must contain at least one gear line' });

export const returnGearBodySchema = z
  .object({
    bulk: z.array(bulkLineSchema).max(50).default([]),
    serialized: z.array(serializedReturnLineSchema).max(50).default([]),
  })
  .refine(nonEmptyPayload, { message: 'Request must contain at least one gear line' });

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
export type BulkLineInput = z.infer<typeof bulkLineSchema>;
export type SerializedIssueLineInput = z.infer<typeof serializedIssueLineSchema>;
export type SerializedReturnLineInput = z.infer<typeof serializedReturnLineSchema>;
