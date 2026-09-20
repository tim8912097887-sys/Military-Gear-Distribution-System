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
