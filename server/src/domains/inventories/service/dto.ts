export const INVENTORY_ADJUSTMENT_TYPES = ['INCREASE', 'DECREASE'] as const;
export type InventoryAdjustmentType = (typeof INVENTORY_ADJUSTMENT_TYPES)[number];

export const INVENTORY_ADJUSTMENT_REASONS = [
  'RECEIVED',
  'LOST',
  'DAMAGED',
  'COUNT_CORRECTION',
] as const;
export type InventoryAdjustmentReason = (typeof INVENTORY_ADJUSTMENT_REASONS)[number];

export type InventoryAdjustment = {
  inventoryItemId: string;
  type: InventoryAdjustmentType;
  quantity: number;
  reason: InventoryAdjustmentReason;
  note: string | null;
  performBy: string;
};

export type InventoryAdjustmentInput = {
  adjustments: InventoryAdjustment[];
};

export type InventoryItemView = {
  name: string;
  size: string | null;
  inventoryId: string;
  stockQuantity: number;
};
