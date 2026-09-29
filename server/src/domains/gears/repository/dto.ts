import type { ActionType, SerializedStatus } from '../../../infrastructure/db/schema/enums.js';
import type { GearCategory, SerializedItem } from '../../../infrastructure/db/schema/index.js';
import type { InventoryItem } from '../../../infrastructure/db/schema/inventory-items.js';
import type {
  BulkLineInput,
  SerializedIssueLineInput,
  SerializedReturnLineInput,
} from '../service/dto.js';

export const RETURN_CONDITIONS = ['SERVICEABLE', 'DAMAGED', 'LOST'] as const;
export type ReturnCondition = (typeof RETURN_CONDITIONS)[number];

export interface HeldBulkRow {
  inventoryItemId: string;
  size: string | null;
  quantity: number;
  categoryId: string;
  categoryName: string;
  issuedAt: Date;
}

export interface HeldSerializedRow {
  custodyId: string;
  serializedItemId: string;
  serialNumber: string;
  size: string | null;
  categoryId: string;
  categoryName: string;
  issuedAt: Date;
}

export interface HistoryRow {
  id: string;
  actionType: ActionType;
  quantity: number | null;
  categoryName: string | null;
  size: string | null;
  serialNumber: string | null;
  createdAt: Date;
}

export interface IssuedBulkResult {
  inventoryItemId: string;
  categoryId: string;
  categoryName: string;
  size: string | null;
  quantity: number;
  remainingStock: number;
  totalHeld: number;
}

export interface IssuedSerializedResult {
  custodyId: string;
  serializedItemId: string;
  serialNumber: string;
  categoryId: string;
  categoryName: string;
  size: string | null;
}

export interface ReturnedBulkResult {
  inventoryItemId: string;
  categoryId: string;
  categoryName: string;
  size: string | null;
  quantity: number;
  remainingHeld: number;
  restockedTo: number;
}

export interface ReturnedSerializedResult {
  serializedItemId: string;
  serialNumber: string;
  categoryId: string;
  categoryName: string;
  size: string | null;
  condition: ReturnCondition;
  newStatus: SerializedStatus;
}

export type ResolvedIssueBulk = {
  line: BulkLineInput;
  inventoryItem: InventoryItem;
  category: GearCategory;
};

export type ResolvedIssueSerialized = {
  line: SerializedIssueLineInput;
  serializedItem: SerializedItem;
  category: GearCategory;
};

export type ValidatedIssueRequest = {
  bulkLines: ResolvedIssueBulk[];
  serializedLines: ResolvedIssueSerialized[];
};

export type ResolvedReturnBulk = {
  line: BulkLineInput;
  inventoryItem: InventoryItem;
  holding: {
    id: string;
    quantity: number;
  };
  category: GearCategory;
};

export type ResolvedReturnSerialized = {
  line: SerializedReturnLineInput;
  custodyId: string;
  serializedItem: SerializedItem;
  category: GearCategory;
};

export type ValidatedReturnRequest = {
  bulkLines: ResolvedReturnBulk[];
  serializedLines: ResolvedReturnSerialized[];
};

export interface GearAvailabilityResult {
  categoryId: string;
  categoryName: string;
  trackingType: 'BULK' | 'SERIALIZED';
  sizes: GearAvailabilitySizeResult[];
}

export type GearAvailabilitySizeResult =
  | {
      categoryId: string;
      inventoryItemId: string;
      size: string | null;
      availableQuantity: number;
    }
  | {
      categoryId: string;
      serializedItemId: string;
      serialNumber: string;
      size: string | null;
      availableQuantity: 1;
    };

export interface GearHistoryResult {
  history: HistoryRow[];
  pagination: {
    total: number;
    limit: number;
    hasMore: boolean;
  };
}
