import { http, HttpResponse } from "msw";
import { successResponse } from "./response";
import {
  buildCheckedInReservist,
  buildReservist,
  paginationResponse,
} from "./factory";

export const handlers = [
  http.get("http://localhost:3000/api/v1/reservists", () => {
    return HttpResponse.json(successResponse(paginationResponse([], {})));
  }),

  http.get("http://localhost:3000/api/v1/reservists/:reservistId", () => {
    return HttpResponse.json(successResponse(buildReservist()));
  }),

  http.post(
    "http://localhost:3000/api/v1/reservists/:reservistId/check-in",
    () => {
      return HttpResponse.json(successResponse(buildCheckedInReservist()));
    },
  ),
];
