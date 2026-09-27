import { setupServer } from "msw/node";
import { handlers } from "./http";

export const server = setupServer(...handlers);
