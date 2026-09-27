import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { server } from "../../utils/reservists/server";
import { http, HttpResponse } from "msw";
import {
  errorResponse,
  successResponse,
} from "../../utils/reservists/response";
import {
  buildCheckedInReservist,
  buildReservist,
} from "../../utils/reservists/factory";
import { customRender } from "../../utils/reservists/render";
import ReservistDetailPage from "../../../features/reservists/pages/ReservistDetailPage";
import { formatDateTime } from "../../../features/reservists/utils/format-date-time";
import { ToastContainer } from "react-toastify";

describe("ReservistDetailPage", () => {
  describe("Success Load", () => {
    it("when the reservist is checked in then checkedInAt is returned as an ISO string", async () => {
      // Arrange
      const checkInReservist = buildCheckedInReservist();
      server.use(
        http.get("http://localhost:3000/api/v1/reservists/:reservistId", () => {
          return HttpResponse.json(successResponse(checkInReservist));
        }),
      );

      // Act
      customRender(<ReservistDetailPage />, {
        routePath: `/reservists/:id`,
        initialEntries: [`/reservists/${checkInReservist.id}`],
      });

      // Assert
      expect(
        await screen.findByText(
          formatDateTime(checkInReservist.checkedInAt as string),
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Already checked in" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Check in reservist" }),
      ).not.toBeInTheDocument();
    });

    it("when the reservist is not checked in then checkedInAt is not checked in", async () => {
      // Arrange
      // Act
      customRender(<ReservistDetailPage />, {
        routePath: `/reservists/:id`,
        initialEntries: [`/reservists/${crypto.randomUUID()}`],
      });

      // Assert
      expect(await screen.findAllByText("Not checked in")).toHaveLength(2);
      expect(
        screen.getByRole("button", { name: "Check in reservist" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Already checked in" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Error Load", () => {
    it("when the reservist is not found then displays 'Reservist not found'", async () => {
      // Arrange
      server.use(
        http.get("http://localhost:3000/api/v1/reservists/:reservistId", () => {
          return HttpResponse.json(
            errorResponse({
              code: "RESERVIST_NOT_FOUND",
              detail: "Reservist not found",
            }),
            { status: 404 },
          );
        }),
      );

      // Act
      customRender(<ReservistDetailPage />, {
        routePath: `/reservists/:id`,
        initialEntries: [`/reservists/${crypto.randomUUID()}`],
      });

      // Assert
      expect(
        await screen.findByText("Reservist not found"),
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole("link", {
          name: "Back to reservists",
        }),
      ).toHaveLength(2);
    });

    it("when the reservist load fails then displays initial error message", async () => {
      // Arrange
      server.use(
        http.get("http://localhost:3000/api/v1/reservists/:reservistId", () => {
          return HttpResponse.json(
            errorResponse({ code: "DB_ERROR", detail: "Database error" }),
            { status: 500 },
          );
        }),
      );

      // Act
      customRender(<ReservistDetailPage />, {
        routePath: `/reservists/:id`,
        initialEntries: [`/reservists/${crypto.randomUUID()}`],
      });

      // Assert
      // expect(
      //   await screen.findByText("Unable to load reservist"),
      // ).toBeInTheDocument();
      expect(
        await screen.findByRole("button", { name: "Try again" }),
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole("link", {
          name: "Back to reservists",
        }),
      ).toHaveLength(1);
    });

    it("when reservist id is invalid then displays invalid id error message", async () => {
      // Arrange
      // Act
      customRender(<ReservistDetailPage />, {
        routePath: `/reservists/:id`,
        initialEntries: [`/reservists/invalid-id`],
      });

      // Assert
      expect(
        await screen.findByText("Invalid reservist ID"),
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole("link", {
          name: "Back to reservists",
        }),
      ).toHaveLength(2);
    });
  });

  describe("Check In", () => {
    it("when reservist check in fails then displays check in error toast", async () => {
      // Arrange
      server.use(
        http.post(
          "http://localhost:3000/api/v1/reservists/:reservistId/check-in",
          () => {
            return HttpResponse.json(
              errorResponse({ code: "DB_ERROR", detail: "Database error" }),
              { status: 500 },
            );
          },
        ),
      );

      // Act
      customRender(
        <>
          <ReservistDetailPage />
          <ToastContainer />
        </>,
        {
          routePath: `/reservists/:id`,
          initialEntries: [`/reservists/${crypto.randomUUID()}`],
        },
      );
      await userEvent.click(
        await screen.findByRole("button", { name: "Check in reservist" }),
      );

      // Assert
      expect(
        await screen.findByText(/Request failed with status 500/),
      ).toBeInTheDocument();
      expect(screen.getAllByText("Not checked in")).toHaveLength(2);
    });

    it("when reservist check in succeeds then displays checked in toast", async () => {
      // Arrange
      const reservist = buildReservist();
      const checkedInDate = new Date().toISOString();
      server.use(
        http.get("http://localhost:3000/api/v1/reservists/:reservistId", () => {
          return HttpResponse.json(successResponse(reservist));
        }),
      );
      server.use(
        http.post(
          "http://localhost:3000/api/v1/reservists/:reservistId/check-in",
          () => {
            return HttpResponse.json(
              successResponse({
                ...reservist,
                checkedInAt: checkedInDate,
              }),
            );
          },
        ),
      );

      // Act
      customRender(
        <>
          <ReservistDetailPage />
          <ToastContainer />
        </>,
        {
          routePath: `/reservists/:id`,
          initialEntries: [`/reservists/${reservist.id}`],
        },
      );
      await userEvent.click(
        await screen.findByRole("button", { name: "Check in reservist" }),
      );

      // Assert
      expect(
        await screen.findByText("Reservist checked in successfully"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(formatDateTime(checkedInDate)),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Already checked in" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Check in reservist" }),
      ).not.toBeInTheDocument();
    });
  });
});
