export type ReservistView = {
  id: string;
  nationalId: string;
  name: string;
  militaryRank: string;
  checkedInAt: string | null;
  createdAt: string;
};

export type ListReservistsResponse = {
  reservists: ReservistView[];
  pagination: { total: number; limit: number; offset: number };
};

export type ListReservistsServiceInput = {
  q?: string;
  checkedIn?: boolean;
  limit: number;
  offset: number;
};
