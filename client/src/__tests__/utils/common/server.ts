import { setupServer } from "msw/node";
import { reservistHandlers } from "../reservists/http";
import { reservistGearHandlers } from "../reservist-gears/http";

export const server = setupServer(
  ...reservistHandlers,
  ...reservistGearHandlers,
);
