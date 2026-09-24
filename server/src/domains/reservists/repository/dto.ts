import type { Reservist } from '../../../infrastructure/db/schema/reservists.js';

export type ListReservistsRepositoryInput = {
  q?: string;
  checkedIn?: boolean;
  limit: number;
  cursor?: string | null;
};

export type ListReservistsResult = {
  rows: Reservist[];
  pagination: {
    total: number;
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
};
