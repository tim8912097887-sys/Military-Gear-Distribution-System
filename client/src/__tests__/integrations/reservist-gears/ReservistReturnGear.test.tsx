import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import ReservistGearDistributionPage from "../../../features/reservist-gears/pages/ReservistGearDistributionPage";
import {
  errorResponse,
  successResponse,
} from "../../utils/common/response";
import { server } from "../../utils/common/server";
import { customRender } from "../../utils/common/render";
import { buildReservistGearStatus } from "../../utils/reservist-gears/factory";
import { reservistGearBasedUrl } from "../../utils/reservist-gears/http";
import { ToastContainer } from "react-toastify";

describe("ReservistReturnGear", () => {
  describe("Success Return", () => {
    it("when the reservist return succeeds then updates the gear info in each section", async () => {
      // Arrange
      const initialGear = buildReservistGearStatus({
        reservist: {
          id: crypto.randomUUID().toString(),
          name: "Test Reservist",
          militaryRank: "Sergeant",
          checkedInAt: new Date().toISOString(),
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
                availableQuantity: 1,
              },
            ],
          },
        ],
      });

      const updatedGear = buildReservistGearStatus({
        reservist: initialGear.reservist,
        holdings: {
          bulk: [],
          serialized: [],
        },
        allowance: [
          {
            categoryId: "category-1",
            categoryName: "Combat Helmet",
            trackingType: "BULK",
            limit: 3,
            held: 0,
            remaining: 3,
          },
        ],
        availability: [
          {
            categoryId: "category-1",
            categoryName: "Combat Helmet",
            trackingType: "BULK",
            remainingAllowance: 3,
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
        http.get(`${reservistGearBasedUrl}/:reservistId/gears`, () => {
          return HttpResponse.json(successResponse(initialGear));
        }),
      );

      server.use(
        http.post(`${reservistGearBasedUrl}/:reservistId/gears/return`, () => {
          return HttpResponse.json(successResponse(updatedGear));
        }),
      );

      // Act
      customRender(<ReservistGearDistributionPage />, {
        routePath: `/reservists/:id/gears`,
        initialEntries: [`/reservists/${initialGear.reservist.id}/gears`],
      });

      const returnQuantityInput =
        await screen.findByLabelText("Return quantity");
      await userEvent.clear(returnQuantityInput);
      await userEvent.type(returnQuantityInput, "1");
      await userEvent.click(
        screen.getByRole("button", { name: "Return selected" }),
      );

      // Assert
      expect(await screen.findByText("No gear issued")).toBeInTheDocument();
      expect(screen.getByText("0 / 3")).toBeInTheDocument();
      expect(screen.getByText("3 remaining")).toBeInTheDocument();
      expect(screen.getByText("2 available")).toBeInTheDocument();
    });
  });

  describe("Error Return", () => {
    it("when the return fails with inventory item lock error then displays error toast and gear info remains unchanged", async () => {
      // Arrange
      const initialGear = buildReservistGearStatus({
        reservist: {
          id: crypto.randomUUID().toString(),
          name: "Test Reservist",
          militaryRank: "Sergeant",
          checkedInAt: new Date().toISOString(),
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
                availableQuantity: 1,
              },
            ],
          },
        ],
      });

      server.use(
        http.get(`${reservistGearBasedUrl}/:reservistId/gears`, () => {
          return HttpResponse.json(successResponse(initialGear));
        }),
      );

      server.use(
        http.post(`${reservistGearBasedUrl}/:reservistId/gears/return`, () => {
          return HttpResponse.json(
            errorResponse({
              code: "INVENTORY_LOCK_TIMEOUT",
              detail:
                "The requested inventory item is currently locked by another transaction. Please try again.",
            }),
            { status: 409 },
          );
        }),
      );

      // Act
      customRender(
        <>
          <ReservistGearDistributionPage />
          <ToastContainer />
        </>,
        {
          routePath: `/reservists/:id/gears`,
          initialEntries: [`/reservists/${initialGear.reservist.id}/gears`],
        },
      );

      const returnQuantityInput =
        await screen.findByLabelText("Return quantity");
      await userEvent.clear(returnQuantityInput);
      await userEvent.type(returnQuantityInput, "1");
      await userEvent.click(
        screen.getByRole("button", { name: "Return selected" }),
      );

      // Assert
      expect(
        await screen.findByText(
          "The requested inventory item is currently locked by another transaction. Please try again.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("Quantity: 1")).toBeInTheDocument();
      expect(screen.getByText("Held: 1")).toBeInTheDocument();
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
      expect(screen.getByText("2 remaining")).toBeInTheDocument();
      expect(screen.getByText("1 available")).toBeInTheDocument();
    });

    it("when the return fails with server error then displays error toast and gear info remains unchanged", async () => {
      // Arrange
      const initialGear = buildReservistGearStatus({
        reservist: {
          id: crypto.randomUUID().toString(),
          name: "Test Reservist",
          militaryRank: "Sergeant",
          checkedInAt: new Date().toISOString(),
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
                availableQuantity: 1,
              },
            ],
          },
        ],
      });

      server.use(
        http.get(`${reservistGearBasedUrl}/:reservistId/gears`, () => {
          return HttpResponse.json(successResponse(initialGear));
        }),
      );

      server.use(
        http.post(`${reservistGearBasedUrl}/:reservistId/gears/return`, () => {
          return HttpResponse.json(
            errorResponse({
              code: "SERVER_ERROR",
              detail: "Server error",
            }),
            { status: 500 },
          );
        }),
      );

      // Act
      customRender(
        <>
          <ReservistGearDistributionPage />
          <ToastContainer />
        </>,
        {
          routePath: `/reservists/:id/gears`,
          initialEntries: [`/reservists/${initialGear.reservist.id}/gears`],
        },
      );

      const returnQuantityInput =
        await screen.findByLabelText("Return quantity");
      await userEvent.clear(returnQuantityInput);
      await userEvent.type(returnQuantityInput, "1");
      await userEvent.click(
        screen.getByRole("button", { name: "Return selected" }),
      );

      // Assert
      expect(await screen.findByText("Server error")).toBeInTheDocument();
      expect(screen.getByText("Quantity: 1")).toBeInTheDocument();
      expect(screen.getByText("Held: 1")).toBeInTheDocument();
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
      expect(screen.getByText("2 remaining")).toBeInTheDocument();
      expect(screen.getByText("1 available")).toBeInTheDocument();
    });
  });
});
