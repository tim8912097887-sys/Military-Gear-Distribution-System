import type {
  ApiSuccessResponse,
  ListReservistsResponse,
  ReservistView,
} from "../../types/index";
import { reservistClient } from "../client/client";

export type ListReservistsParams = {
  q?: string;
  checkedIn?: boolean;
  limit: number;
  cursor: string | null;
};

export async function listReservists(
  params: ListReservistsParams,
): Promise<ListReservistsResponse> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const response = await reservistClient.get<
    ApiSuccessResponse<ListReservistsResponse>
  >("", {
    params,
  });

  return response.data.data;
}

export async function getReservist(
  reservistId: string,
): Promise<ReservistView> {
  const response = await reservistClient.get<ApiSuccessResponse<ReservistView>>(
    `/${reservistId}`,
  );

  return response.data.data;
}

export async function checkInReservist(
  reservistId: string,
): Promise<ReservistView> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const response = await reservistClient.post<
    ApiSuccessResponse<ReservistView>
  >(`/${reservistId}/check-in`);

  return response.data.data;
}
