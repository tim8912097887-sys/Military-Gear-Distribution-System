import { render } from "@testing-library/react";
import ReservistListPanel, {
  type ReservistListPanelProps,
} from "../../../features/reservists/components/ui/list/ReservistListPanel";
import { vi } from "vitest";
import { buildReservists } from "./factory";
import { MemoryRouter } from "react-router";

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
