import type { SerializedStatus } from '../../../infrastructure/db/schema/enums.js';

export type GetGearInput = {
  include: Set<string>;
  historyLimit: number;
};

export type BulkLineInput = {
  inventoryItemId: string;
  quantity: number;
};

export type SerializedIssueLineInput = {
  serialNumber: string;
};

export type IssueGearInput = {
  bulk: BulkLineInput[];
  serialized: SerializedIssueLineInput[];
};

export type SerializedReturnLineInput = {
  serialNumber: string;
  condition: ReturnCondition;
};

export type ReturnGearInput = {
  bulk: BulkLineInput[];
  serialized: SerializedReturnLineInput[];
};

export const CONDITION_TO_STATUS: Record<ReturnCondition, SerializedStatus> = {
  SERVICEABLE: 'AVAILABLE',
  DAMAGED: 'MAINTENANCE',
  LOST: 'LOST',
};

export const RETURN_CONDITIONS = ['SERVICEABLE', 'DAMAGED', 'LOST'] as const;
export type ReturnCondition = (typeof RETURN_CONDITIONS)[number];
