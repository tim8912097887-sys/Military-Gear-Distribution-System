import { http, HttpResponse } from "msw";
import { successResponse } from "../common/response";
import {
  buildCheckedInReservist,
  buildReservist,
  paginationResponse,
} from "./factory";

export const reservistBasedUrl =
  import.meta.env.VITE_API_BASE_URL + "/api/v1/reservists";

export const reservistHandlers = [
  http.get(reservistBasedUrl, () => {
    return HttpResponse.json(successResponse(paginationResponse([], {})));
  }),

  http.get(`${reservistBasedUrl}/:reservistId`, () => {
    return HttpResponse.json(successResponse(buildReservist()));
  }),

  http.post(`${reservistBasedUrl}/:reservistId/check-in`, () => {
    return HttpResponse.json(successResponse(buildCheckedInReservist()));
  }),
];
