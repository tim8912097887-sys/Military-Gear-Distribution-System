import { describe, expect, it } from "vitest";
import { customRender } from "../../utils/reservists/render";
import ReservistListPage from "../../../features/reservists/pages/ReservistListPage";
import { fireEvent, screen } from "@testing-library/react";
import { server } from "../../utils/reservists/server";
import { http, HttpResponse } from "msw";
import {
  errorResponse,
  successResponse,
} from "../../utils/reservists/response";
import {
  buildCheckedInReservists,
  buildReservists,
  paginationResponse,
} from "../../utils/reservists/factory";
import { INITIAL_LIMIT } from "../../../features/reservists/constants/limit";

describe("ReservistListPage", () => {
  describe("Initial State", () => {
    it("when no reservists exist then displays 'No reservists found'", async () => {
      // Arrange
      // Act
      customRender(<ReservistListPage />, {
        routePath: "/reservists",
        initialEntries: ["/reservists"],
      });

      // Assert
      expect(
        await screen.findByText("No reservists found"),
      ).toBeInTheDocument();
      expect(screen.getByText("0 loaded")).toBeInTheDocument();
      expect(
        screen.queryByText("More records available"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("There are no reservist records yet."),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", {
          name: "Load more reservists",
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("You've reached the end of the list."),
      ).not.toBeInTheDocument();
    });

    it("when reservists exist then displays '3 loaded'", async () => {
      // Arrange
      const reservists = buildReservists(INITIAL_LIMIT);
      server.use(
        http.get("http://localhost:3000/api/v1/reservists", () => {
          return HttpResponse.json(
            successResponse(
              paginationResponse(reservists, {
                total: 5,
                limit: INITIAL_LIMIT,
                hasMore: true,
                nextCursor: "cursor",
              }),
            ),
          );
        }),
      );

      // Act
      customRender(<ReservistListPage />, {
        routePath: "/reservists",
        initialEntries: ["/reservists"],
      });

      // Assert
      expect(await screen.findByText("3 loaded")).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: "Load more reservists",
        }),
      ).toBeInTheDocument();
      expect(screen.queryByText("No reservists found")).not.toBeInTheDocument();
      expect(
        screen.queryByText("You've reached the end of the list."),
      ).not.toBeInTheDocument();
      expect(screen.getByText("More records available")).toBeInTheDocument();
    });

    it("when reservists exist with two check in out of 3 then displays 2 checked in status", async () => {
      // Arrange
      const notCheckedIn = buildReservists(1);
      const checkedIn = buildCheckedInReservists(2);

      server.use(
        http.get("http://localhost:3000/api/v1/reservists", () => {
          return HttpResponse.json(
            successResponse(
              paginationResponse([...notCheckedIn, ...checkedIn], {
                total: 5,
                limit: INITIAL_LIMIT,
                hasMore: true,
                nextCursor: "cursor",
              }),
            ),
          );
        }),
      );

      // Act
      customRender(<ReservistListPage />, {
        routePath: "/reservists",
        initialEntries: ["/reservists"],
      });

      // Assert
      expect(await screen.findAllByText("Not checked in")).toHaveLength(1);
      expect(screen.getAllByText("Checked in")).toHaveLength(2);
    });

    it("when initial load fails then displays initial error message", async () => {
      // Arrange
      server.use(
        http.get("http://localhost:3000/api/v1/reservists", () => {
          return HttpResponse.json(
            errorResponse({ code: "DB_ERROR", detail: "Database error" }),
            { status: 500 },
          );
        }),
      );

      // Act
      customRender(<ReservistListPage />, {
        routePath: "/reservists",
        initialEntries: ["/reservists"],
      });

      // Assert
      expect(
        await screen.findByText("Unable to load reservists"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("More records available"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", {
          name: "Load more reservists",
        }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Pagination", () => {
    it("when loading the next page fails then displays the pagination error", async () => {
      // Arrange
      const reservists = buildReservists(INITIAL_LIMIT);
      server.use(
        http.get("http://localhost:3000/api/v1/reservists", ({ request }) => {
          const cursor = new URL(request.url).searchParams.get("cursor");

          if (cursor === "cursor") {
            return HttpResponse.json(
              errorResponse({
                code: "DB_ERROR",
                detail: "Database error",
              }),
              { status: 500 },
            );
          }

          return HttpResponse.json(
            successResponse(
              paginationResponse(reservists, {
                total: 6,
                limit: INITIAL_LIMIT,
                hasMore: true,
                nextCursor: "cursor",
              }),
            ),
          );
        }),
      );

      // Act
      customRender(<ReservistListPage />, {
        routePath: "/reservists",
        initialEntries: ["/reservists"],
      });
      fireEvent.click(
        await screen.findByRole("button", { name: "Load more reservists" }),
      );

      // Assert
      expect(
        await screen.findByText("Couldn't load more reservists"),
      ).toBeInTheDocument();
      expect(screen.getByText("3 loaded")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Load more reservists" }),
      ).not.toBeInTheDocument();
    });

    it("when the final page loads then displays the end of list", async () => {
      // Arrange
      const firstPage = buildReservists(INITIAL_LIMIT);
      const lastPage = buildReservists(INITIAL_LIMIT);
      server.use(
        http.get("http://localhost:3000/api/v1/reservists", ({ request }) => {
          const cursor = new URL(request.url).searchParams.get("cursor");
          const reservists = cursor === "cursor" ? lastPage : firstPage;

          return HttpResponse.json(
            successResponse(
              paginationResponse(reservists, {
                total: firstPage.length + lastPage.length,
                limit: INITIAL_LIMIT,
                hasMore: cursor !== "cursor",
                nextCursor: cursor === "cursor" ? null : "cursor",
              }),
            ),
          );
        }),
      );

      // Act
      customRender(<ReservistListPage />, {
        routePath: "/reservists",
        initialEntries: ["/reservists"],
      });
      fireEvent.click(
        await screen.findByRole("button", { name: "Load more reservists" }),
      );

      // Assert
      expect(await screen.findByText("6 loaded")).toBeInTheDocument();
      expect(
        screen.getByText("You've reached the end of the list."),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("More records available"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Load more reservists" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Couldn't load more reservists"),
      ).not.toBeInTheDocument();
    });

    it("when another page remains after loading then keeps the load more action", async () => {
      // Arrange
      const firstPage = buildReservists(INITIAL_LIMIT);
      const secondPage = buildReservists(INITIAL_LIMIT);
      server.use(
        http.get("http://localhost:3000/api/v1/reservists", ({ request }) => {
          const cursor = new URL(request.url).searchParams.get("cursor");
          const isInitialPage = cursor !== "cursor";

          return HttpResponse.json(
            successResponse(
              paginationResponse(isInitialPage ? firstPage : secondPage, {
                total: 9,
                limit: INITIAL_LIMIT,
                hasMore: true,
                nextCursor: isInitialPage ? "cursor" : "next-cursor",
              }),
            ),
          );
        }),
      );

      // Act
      customRender(<ReservistListPage />, {
        routePath: "/reservists",
        initialEntries: ["/reservists"],
      });
      fireEvent.click(
        await screen.findByRole("button", { name: "Load more reservists" }),
      );

      // Assert
      expect(await screen.findByText("6 loaded")).toBeInTheDocument();
      expect(screen.getByText("More records available")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Load more reservists" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("You've reached the end of the list."),
      ).not.toBeInTheDocument();
    });
  });
});
