import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import ReservistGearDistributionPage from "../../../features/reservist-gears/pages/ReservistGearDistributionPage";
import { errorResponse, successResponse } from "../../utils/common/response";
import { server } from "../../utils/common/server";
import { customRender } from "../../utils/common/render";
import { buildReservistGearStatus } from "../../utils/reservist-gears/factory";
import { reservistGearBasedUrl } from "../../utils/reservist-gears/http";
import { ToastContainer } from "react-toastify";

describe("ReservistIssueGear", () => {
  describe("Success Issue", () => {
    it("when the reservist issue succeeds then updates the gear info in each section", async () => {
      // Arrange
      const initialGear = buildReservistGearStatus({
        reservist: {
          id: crypto.randomUUID().toString(),
          name: "Test Reservist",
          militaryRank: "Sergeant",
          checkedInAt: new Date().toISOString(),
        },
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

      const updatedGear = buildReservistGearStatus({
        reservist: initialGear.reservist,
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
        http.post(`${reservistGearBasedUrl}/:reservistId/gears/issue`, () => {
          return HttpResponse.json(successResponse(updatedGear));
        }),
      );

      // Act
      customRender(<ReservistGearDistributionPage />, {
        routePath: `/reservists/:id/gears`,
        initialEntries: [`/reservists/${initialGear.reservist.id}/gears`],
      });

      const quantityInput = await screen.findByLabelText("Quantity");
      await userEvent.clear(quantityInput);
      await userEvent.type(quantityInput, "1");
      await userEvent.click(
        screen.getByRole("button", { name: "Issue selected" }),
      );

      // Assert
      expect(await screen.findByText("Quantity: 1")).toBeInTheDocument();
      expect(screen.getByText("Held: 1")).toBeInTheDocument();
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
      expect(screen.getByText("2 remaining")).toBeInTheDocument();
      expect(screen.getByText("1 available")).toBeInTheDocument();
    });
  });

  describe("Error Issue", () => {
    it("when the reservist issue fails with insufficient quantity error then displays error toast and gear info remain unchanged", async () => {
      // Arrange
      const initialGear = buildReservistGearStatus({
        reservist: {
          id: crypto.randomUUID().toString(),
          name: "Test Reservist",
          militaryRank: "Sergeant",
          checkedInAt: new Date().toISOString(),
        },
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
        http.post(`${reservistGearBasedUrl}/:reservistId/gears/issue`, () => {
          return HttpResponse.json(
            errorResponse({
              code: "INSUFFICIENT_QUANTITY",
              detail: "Insufficient quantity",
            }),
            { status: 400 },
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

      const quantityInput = await screen.findByLabelText("Quantity");
      await userEvent.clear(quantityInput);
      await userEvent.type(quantityInput, "3");
      await userEvent.click(
        screen.getByRole("button", { name: "Issue selected" }),
      );

      // Assert
      expect(
        await screen.findByText("Insufficient quantity"),
      ).toBeInTheDocument();
      expect(screen.getByText("3 remaining")).toBeInTheDocument();
      expect(screen.queryByText("Held: 3")).not.toBeInTheDocument();
      expect(screen.queryByText("3 / 3")).not.toBeInTheDocument();
      expect(screen.queryByText("Allowance reached")).not.toBeInTheDocument();
      expect(screen.getByText("2 available")).toBeInTheDocument();
    });

    it("when the reservist issue fails with server error then displays error toast and gear info remain unchanged", async () => {
      // Arrange
      const initialGear = buildReservistGearStatus({
        reservist: {
          id: crypto.randomUUID().toString(),
          name: "Test Reservist",
          militaryRank: "Sergeant",
          checkedInAt: new Date().toISOString(),
        },
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
        http.post(`${reservistGearBasedUrl}/:reservistId/gears/issue`, () => {
          return HttpResponse.json(
            errorResponse({
              code: "SERVER_ERROR",
              detail: "Server error",
            }),
            {
              status: 500,
            },
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

      const quantityInput = await screen.findByLabelText("Quantity");
      await userEvent.clear(quantityInput);
      await userEvent.type(quantityInput, "3");
      await userEvent.click(
        screen.getByRole("button", { name: "Issue selected" }),
      );

      // Assert
      expect(await screen.findByText("Server error")).toBeInTheDocument();
      expect(screen.getByText("3 remaining")).toBeInTheDocument();
      expect(screen.queryByText("Held: 3")).not.toBeInTheDocument();
      expect(screen.queryByText("3 / 3")).not.toBeInTheDocument();
      expect(screen.queryByText("Allowance reached")).not.toBeInTheDocument();
      expect(screen.getByText("2 available")).toBeInTheDocument();
    });
  });
});
