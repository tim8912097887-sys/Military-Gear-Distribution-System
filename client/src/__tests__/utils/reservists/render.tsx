import { render } from "@testing-library/react";
import ReservistListPanel, {
  type ReservistListPanelProps,
} from "../../../features/reservists/components/ui/list/ReservistListPanel";
import { vi } from "vitest";
import { buildReservists } from "./factory";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface CustomRenderOptions {
  // Path pattern defined in the actual router (e.g., "/reservists/:reservistId")
  routePath?: string;
  // The actual URL loaded in the test (e.g., "/reservists/123")
  initialEntries?: string[];
}

export const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions,
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Solve retry override issue
        retryDelay: 0,
      },
    },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={options.initialEntries}>
        <Routes>
          <Route path={options.routePath} element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

export const renderPanel = (
  overrides: Partial<ReservistListPanelProps> = {},
) => {
  const props: ReservistListPanelProps = {
    reservists: buildReservists(3),
    hasNextPage: false,
    hasNextPageError: false,
    isInitialLoading: false,
    hasInitialError: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    search: "",
    setSearch: vi.fn(),
    ...overrides,
  };

  render(
    <MemoryRouter>
      <ReservistListPanel {...props} />
    </MemoryRouter>,
  );

  return props;
};
