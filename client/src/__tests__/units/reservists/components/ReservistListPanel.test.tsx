import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderPanel } from "../../../utils/reservists/render";
import { buildReservists } from "../../../utils/reservists/factory";
import { RESERVIST_CARD_SKELETON_TEST_ID } from "../../../../features/reservists/constants/test-id";
import {
  INCREMENT_LIMIT,
  INITIAL_LIMIT,
} from "../../../../features/reservists/constants/limit";

describe("ReservistListPanel", () => {
  it("when rendered reservist list panel without loading state and error,should display required elements", () => {
    // Arrange
    const reservistsAmount = 3;
    const reservists = buildReservists(reservistsAmount);
    // Act
    renderPanel({
      reservists,
    });

    // Assert
    expect(screen.getByText(reservistsAmount + " loaded")).toBeInTheDocument();
    expect(
      screen.queryByText("More records available"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(RESERVIST_CARD_SKELETON_TEST_ID),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Unable to load reservists"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Your existing records are still available."),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(
      screen.getByText("You've reached the end of the list."),
    ).toBeInTheDocument();
    expect(screen.queryByText("No reservists found")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(reservistsAmount);
  });

  it("when rendered reservist list panel with loading state,should display required elements", () => {
    // Arrange
    const reservistsAmount = 3;
    const reservists = buildReservists(reservistsAmount);
    // Act
    renderPanel({
      reservists,
      isInitialLoading: true,
    });

    // Assert
    expect(
      screen.queryByText(reservistsAmount + " loaded"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("More records available"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByTestId(RESERVIST_CARD_SKELETON_TEST_ID)).toHaveLength(
      INITIAL_LIMIT,
    );
    expect(
      screen.queryByText("Unable to load reservists"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Your existing records are still available."),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(
      screen.queryByText("You've reached the end of the list."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("No reservists found")).not.toBeInTheDocument();
  });

  it("when rendered with an empty list,should display the empty state", () => {
    // Arrange
    renderPanel({ reservists: [] });

    // Assert
    expect(screen.getByText("No reservists found")).toBeInTheDocument();
    expect(
      screen.getByText("There are no reservist records yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Load more reservists" }),
    ).not.toBeInTheDocument();
  });

  it("when rendered with an initial error,should allow retrying the request", () => {
    // Arrange
    const { refetch } = renderPanel({ hasInitialError: true });

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    // Assert
    expect(screen.getByText("Unable to load reservists")).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledOnce();
    expect(screen.queryByText("3 loaded")).not.toBeInTheDocument();
  });

  it("when another page is available,should display the load more action", () => {
    // Arrange
    const { fetchNextPage } = renderPanel({ hasNextPage: true });

    // Act
    fireEvent.click(
      screen.getByRole("button", { name: "Load more reservists" }),
    );

    // Assert
    expect(screen.getByText("More records available")).toBeInTheDocument();
    expect(fetchNextPage).toHaveBeenCalledOnce();
  });

  it("when fetching the next page,should display loading skeletons", () => {
    // Arrange
    renderPanel({ hasNextPage: true, isFetchingNextPage: true });

    // Assert
    expect(screen.getAllByTestId(RESERVIST_CARD_SKELETON_TEST_ID)).toHaveLength(
      INITIAL_LIMIT,
    );
    expect(
      screen.queryByRole("button", { name: "Load more reservists" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(INCREMENT_LIMIT);
  });

  it("when loading the next page fails,should allow retrying the page", () => {
    // Arrange
    const { fetchNextPage } = renderPanel({
      hasNextPage: true,
      hasNextPageError: true,
    });

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    // Assert
    expect(
      screen.getByText("Couldn't load more reservists"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your existing records are still available."),
    ).toBeInTheDocument();
    expect(fetchNextPage).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole("button", { name: "Load more reservists" }),
    ).not.toBeInTheDocument();
  });
});
