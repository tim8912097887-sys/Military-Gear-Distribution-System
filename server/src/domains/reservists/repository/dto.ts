import type { Reservist } from '../../../infrastructure/db/schema/reservists.js';

export type ListReservistsRepositoryInput = {
  q?: string;
  checkedIn?: boolean;
  limit: number;
  offset: number;
};

export type ListReservistsResult = {
  rows: Reservist[];
  total: number;
};
