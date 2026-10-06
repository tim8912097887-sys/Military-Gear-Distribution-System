import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getGearHistoryForReservist } from "../api/query/query";
import { useState } from "react";
import { reservistGearKeys } from "../constants/key";
import { ApiError } from "../../../common/error/api-error";

export function useGetGearHistoryForReservist(
  reservistId: string,
  enabled: boolean,
) {
  const [offset, setOffset] = useState(0);

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: reservistGearKeys.history(reservistId, offset),
    queryFn: () => {
      const response = getGearHistoryForReservist(reservistId, {
        offset,
        limit: 5,
      });

      return response;
    },
    staleTime: 120_000,
    placeholderData: keepPreviousData,
    enabled,
    retry: (failureCount, error) => {
      // Stop retrying if it's a client error (4xx) or if the failure count exceeds 3
      if (
        error instanceof ApiError &&
        typeof error.status === "number" &&
        error.status < 500
      ) {
        return false;
      }

      return failureCount < 3;
    },
  });

  return {
    data,
    offset,
    setOffset,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  };
}
