import type { ApiSuccessResponse } from "../../../../common/types/response/response";
import type {
  GearHistoryResponse,
  // GearHistoryResponse,
  GearStatusResponse,
  GetGearHistoryInput,
  IssueGearInput,
  ReturnGearInput,
} from "../../types";
import { gearClient } from "../client/client";

export async function getGearForReservist(reservistId: string) {
  const response = await gearClient.get<ApiSuccessResponse<GearStatusResponse>>(
    `/${reservistId}/gears`,
  );

  return response.data.data;
}

export async function issueGear(reservistId: string, body: IssueGearInput) {
  const response = await gearClient.post<
    ApiSuccessResponse<GearStatusResponse>
  >(`/${reservistId}/gears/issue`, body);

  return response.data.data;
}

export async function returnGear(reservistId: string, body: ReturnGearInput) {
  const response = await gearClient.post<
    ApiSuccessResponse<GearStatusResponse>
  >(`/${reservistId}/gears/return`, body);

  return response.data.data;
}

export async function getGearHistoryForReservist(
  reservistId: string,
  query: GetGearHistoryInput,
) {
  const response = await gearClient.get<
    ApiSuccessResponse<GearHistoryResponse>
  >(`/${reservistId}/gears/history`, { params: query });

  return response.data.data;
}
