export const TRACKING_TYPES = ['BULK', 'SERIALIZED'] as const;
export type TrackingType = (typeof TRACKING_TYPES)[number];

export const SERIALIZED_STATUSES = [
  'AVAILABLE',
  'ISSUED',
  'MAINTENANCE',
  'LOST',
  'RETIRED',
] as const;
export type SerializedStatus = (typeof SERIALIZED_STATUSES)[number];

export const ACTION_TYPES = ['ISSUE', 'RETURN'] as const;
export type ActionType = (typeof ACTION_TYPES)[number];
