import { useQuery } from "@tanstack/react-query";
import { getGearForReservist } from "../api/query/query";
import { reservistGearKeys } from "../constants/key";
import { ApiError } from "../../../common/error/api-error";

export function useGetGearForReservist(reservistId: string, enabled: boolean) {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: reservistGearKeys.all(reservistId),
    queryFn: () => {
      return getGearForReservist(reservistId);
    },
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
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

  return { data, isPending, isError, error, refetch };
}
