import { describe, expect, it } from "vitest";
import ReservistGearDistributionPage from "../../../features/reservist-gears/pages/ReservistGearDistributionPage";
import { customRender } from "../../utils/common/render";
import { screen } from "@testing-library/react";
import { buildReservistGearStatus } from "../../utils/reservist-gears/factory";
import { http, HttpResponse } from "msw";
import { server } from "../../utils/common/server";
import { reservistGearBasedUrl } from "../../utils/reservist-gears/http";
import { errorResponse, successResponse } from "../../utils/common/response";

describe("ReservistGetGearsStatus", () => {
  describe("Success Load", () => {
    it("when the reservist has designated gear info then displays it on screen", async () => {
      // Arrange
      const reservistGears = buildReservistGearStatus({
        reservist: {
          id: crypto.randomUUID().toString(),
          name: "Test Reservist",
          militaryRank: "Sergeant",
          checkedInAt: new Date("2023-01-01T00:00:00Z").toISOString(),
        },
        holdings: {
          bulk: [
            {
              inventoryItemId: "inventory-1",
              categoryId: "category-1",
              categoryName: "Combat Helmet",
              size: "M",
              quantity: 1,
              issuedAt: new Date("2024-01-02T00:00:00Z").toISOString(),
            },
          ],
          serialized: [],
        },
        allowance: [
          {
            categoryId: "category-1",
            categoryName: "Combat Helmet",
            trackingType: "BULK",
            limit: 3,
            held: 1,
            remaining: 2,
          },
        ],
        availability: [
          {
            categoryId: "category-1",
            categoryName: "Combat Helmet",
            trackingType: "BULK",
            remainingAllowance: 2,
            sizes: [
              {
                inventoryItemId: "inventory-1",
                size: "M",
                availableQuantity: 2,
              },
            ],
          },
        ],
      });
      server.use(
        http.get(
          `${reservistGearBasedUrl}/${reservistGears.reservist.id}/gears`,
          () => {
            return HttpResponse.json(successResponse(reservistGears));
          },
        ),
      );

      // Act
      customRender(<ReservistGearDistributionPage />, {
        routePath: `/reservists/:id/gears`,
        initialEntries: [`/reservists/${reservistGears.reservist.id}/gears`],
      });

      // Assert
      expect(await screen.findByText("Current holdings")).toBeInTheDocument();
      expect(screen.getByText("Allowance")).toBeInTheDocument();
      expect(screen.getByText("Checked in")).toBeInTheDocument();
      expect(screen.getAllByText("Combat Helmet").length).toBeGreaterThan(0);
      expect(screen.getByText("Size M")).toBeInTheDocument();
      expect(screen.getByText("Quantity: 1")).toBeInTheDocument();
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
      expect(screen.getByText("2 remaining")).toBeInTheDocument();
    });

    it("when the reservist does not hold any gear then displays with empty info in each section", async () => {
      // Arrange
      const reservistGears = buildReservistGearStatus({});
      server.use(
        http.get(
          `${reservistGearBasedUrl}/${reservistGears.reservist.id}/gears`,
          () => {
            return HttpResponse.json(successResponse(reservistGears));
          },
        ),
      );

      // Act
      customRender(<ReservistGearDistributionPage />, {
        routePath: `/reservists/:id/gears`,
        initialEntries: [`/reservists/${reservistGears.reservist.id}/gears`],
      });

      // Assert
      expect(await screen.findByText("No gear issued")).toBeInTheDocument();
      expect(screen.getByText("Checked in")).toBeInTheDocument();
      expect(screen.getAllByText("No gear selected")).toHaveLength(2);
      expect(
        screen.queryByTestId("gear-allowance-card"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("issue-gear-row")).not.toBeInTheDocument();
      expect(screen.queryByTestId("return-gear-row")).not.toBeInTheDocument();
    });
  });

  describe("Error Load", () => {
    it("when the reservist is not found then displays 'Reservist not found'", async () => {
      // Arrange
      server.use(
        http.get(`${reservistGearBasedUrl}/:reservistId/gears`, () => {
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
      customRender(<ReservistGearDistributionPage />, {
        routePath: `/reservists/:id/gears`,
        initialEntries: [`/reservists/${crypto.randomUUID()}/gears`],
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

    it("when reservist id is invalid then displays invalid id error message", async () => {
      // Arrange
      // Act
      customRender(<ReservistGearDistributionPage />, {
        routePath: `/reservists/:id/gears`,
        initialEntries: [`/reservists/invalid-id/gears`],
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

    it("when the reservist load fails then displays initial error message", async () => {
      // Arrange
      server.use(
        http.get(`${reservistGearBasedUrl}/:reservistId/gears`, () => {
          return HttpResponse.json(
            errorResponse({ code: "DB_ERROR", detail: "Database error" }),
            { status: 500 },
          );
        }),
      );

      // Act
      customRender(<ReservistGearDistributionPage />, {
        routePath: `/reservists/:id/gears`,
        initialEntries: [`/reservists/${crypto.randomUUID()}/gears`],
      });

      // Assert
      expect(
        await screen.findByText("Unable to load gear"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Try again" }),
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole("link", {
          name: "Back to reservists",
        }),
      ).toHaveLength(1);
    });
  });
});
