type ActionType = "ISSUE" | "RETURN";

export const RETURN_CONDITIONS = ["SERVICEABLE", "DAMAGED", "LOST"] as const;
export type ReturnCondition = (typeof RETURN_CONDITIONS)[number];

// Input
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

export type GetGearHistoryInput = {
  offset: number;
  limit: number;
};

// Response
export interface GearAvailabilityResponse {
  categoryId: string;
  categoryName: string;
  trackingType: "BULK" | "SERIALIZED";
  remainingAllowance: number;
  sizes: GearAvailabilitySizeResponse[];
}

export type GearAvailabilitySizeResponse =
  | {
      inventoryItemId: string;
      size: string | null;
      availableQuantity: number;
    }
  | {
      serializedItemId: string;
      serialNumber: string;
      size: string | null;
      availableQuantity: 1;
    };

export interface HeldBulkView {
  inventoryItemId: string;
  categoryId: string;
  categoryName: string;
  size: string | null;
  quantity: number;
  issuedAt: string;
}

export interface HeldSerializedView {
  custodyId: string;
  serializedItemId: string;
  serialNumber: string;
  categoryId: string;
  categoryName: string;
  size: string | null;
  issuedAt: string;
}

export interface GearAllowanceView {
  categoryId: string;
  categoryName: string;
  trackingType: "BULK" | "SERIALIZED";
  limit: number;
  held: number;
  remaining: number;
}

export interface GearHistoryView {
  id: string;
  actionType: ActionType;
  categoryName: string | null;
  size: string | null;
  serialNumber: string | null;
  quantity: number | null;
  createdAt: string;
}

export interface GearStatusResponse {
  reservist: {
    id: string;
    name: string;
    militaryRank: string;
    checkedInAt: string | null;
  };

  holdings: {
    bulk: HeldBulkView[];
    serialized: HeldSerializedView[];
  };

  allowance: GearAllowanceView[];
  availability: GearAvailabilityResponse[];
}

export interface GearHistoryResponse {
  history: GearHistoryView[];
  pagination: {
    total: number;
    limit: number;
    hasMore: boolean;
  };
}
