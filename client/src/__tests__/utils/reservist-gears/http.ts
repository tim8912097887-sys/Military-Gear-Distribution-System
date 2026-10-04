import { http, HttpResponse } from "msw";
import { successResponse } from "../common/response";
import { buildReservistGearStatus } from "./factory";

export const reservistGearBasedUrl =
  import.meta.env.VITE_API_BASE_URL + "/api/v1/reservists";

export const reservistGearHandlers = [
  http.get(`${reservistGearBasedUrl}/:reservistId/gears`, () => {
    return HttpResponse.json(successResponse(buildReservistGearStatus({})));
  }),

  http.post(`${reservistGearBasedUrl}/:reservistId/gears/issue`, () => {
    return HttpResponse.json(successResponse(buildReservistGearStatus({})));
  }),

  http.post(`${reservistGearBasedUrl}/:reservistId/gears/return`, () => {
    return HttpResponse.json(successResponse(buildReservistGearStatus({})));
  }),
];
