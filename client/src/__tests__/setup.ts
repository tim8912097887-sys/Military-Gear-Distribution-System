import { afterAll, beforeAll, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./utils/reservists/server";

beforeAll(() => server.listen());

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.resetAllMocks();
  server.resetHandlers();
});

afterAll(() => server.close());
