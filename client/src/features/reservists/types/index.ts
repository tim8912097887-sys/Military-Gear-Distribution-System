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
  pagination: {
    total: number;
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
};

type ApiMeta = {
  timestamp: string;
};

export type ApiSuccessResponse<T> = {
  state: "success";
  error: null;
  data: T;
  meta: ApiMeta;
};

export type ApiFailure = {
  state: "error";
  data: null;
  error: {
    code: string;
    message: string;
  };
  meta: ApiMeta;
};
