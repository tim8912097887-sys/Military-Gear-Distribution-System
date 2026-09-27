import { http, HttpResponse } from "msw";
import { successResponse } from "./response";
import {
  buildCheckedInReservist,
  buildReservist,
  paginationResponse,
} from "./factory";

export const basedUrl =
  import.meta.env.VITE_API_BASE_URL + "/api/v1/reservists";

export const handlers = [
  http.get(basedUrl, () => {
    return HttpResponse.json(successResponse(paginationResponse([], {})));
  }),

  http.get(`${basedUrl}/:reservistId`, () => {
    return HttpResponse.json(successResponse(buildReservist()));
  }),

  http.post(`${basedUrl}/:reservistId/check-in`, () => {
    return HttpResponse.json(successResponse(buildCheckedInReservist()));
  }),
];
