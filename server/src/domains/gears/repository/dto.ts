import type { ActionType } from '../../../infrastructure/db/schema/enums.js';

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
