import type { ListReservistsResponse, ReservistView } from "../../types/index";

export type ListReservistsParams = {
  q?: string;
  checkedIn?: boolean;
  limit: number;
  cursor: string | null;
};

const fakeReservists: ReservistView[] = Array.from({ length: 20 }, (_, i) => {
  const pad = (num: number) => String(num).padStart(2, "0");
  const index = i + 1;
  return {
    id: String(index),
    nationalId: `A1234567${pad(index)}`,
    name: `Reservist ${index}`,
    militaryRank:
      index % 3 === 0 ? "Sergeant" : index % 2 === 0 ? "Corporal" : "Private",
    checkedInAt: index % 2 === 0 ? `2024-01-${pad(index)}T08:00:00.000Z` : null,
    createdAt: `2024-01-${pad(index)}T00:00:00.000Z`,
  };
});

const getSingleReservist = async (id: string) =>
  fakeReservists.find((r) => r.id === id);

const getReservists = async ({
  q,
  cursor,
  limit = 5,
  checkedIn,
}: ListReservistsParams) => {
  const filtered = fakeReservists
    .filter((r) => {
      if (checkedIn !== undefined) {
        return checkedIn === (r.checkedInAt !== null);
      }
      return true;
    })
    .filter((r) => {
      if (q) {
        return (
          r.name.toLowerCase().includes(q.toLowerCase()) ||
          r.nationalId.toLowerCase().includes(q.toLowerCase())
        );
      }
      return true;
    })
    .filter((r) => {
      if (cursor) {
        return r.createdAt > cursor;
      }
      return true;
    });

  // Fetch limit + 1 to check if another page exists
  const sliced = filtered.slice(0, limit + 1);
  const hasMore = sliced.length > limit;

  // Trim to the actual requested limit
  const data = hasMore ? sliced.slice(0, limit) : sliced;
  const nextCursor = data.length > 0 ? data[data.length - 1].createdAt : null;

  return {
    reservists: data,
    pagination: {
      total: filtered.length,
      limit,
      nextCursor,
      hasMore,
    },
  };
};

export async function listReservists(
  params: ListReservistsParams,
): Promise<ListReservistsResponse> {
  // const response = await reservistClient.get<
  //   ApiSuccessResponse<ListReservistsResponse>
  // >("", {
  //   params,
  // });

  await new Promise((resolve) => setTimeout(resolve, 800));
  const randomNum = Math.floor(Math.random() * 10);
  if (randomNum % 2 === 0) {
    throw new Error("Something went wrong");
  }
  return getReservists(params);
}

export async function getReservist(
  reservistId: string,
): Promise<ReservistView> {
  // const response = await reservistClient.get<ApiSuccessResponse<ReservistView>>(
  //   `/${reservistId}`,
  // );
  await new Promise((resolve) => setTimeout(resolve, 800));
  const response = await getSingleReservist(reservistId);
  return response!;
}

export async function checkInReservist(
  reservistId: string,
): Promise<ReservistView> {
  // const response = await reservistClient.post<
  //   ApiSuccessResponse<ReservistView>
  // >(`/${reservistId}/check-in`);

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const existReservist = await getSingleReservist(reservistId);

  if (existReservist) {
    return {
      ...existReservist,
      checkedInAt: new Date().toISOString(),
    };
  }

  throw new Error("Reservist not found");
}
