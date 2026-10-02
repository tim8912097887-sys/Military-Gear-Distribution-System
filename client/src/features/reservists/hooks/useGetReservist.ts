import { useQuery } from "@tanstack/react-query";
import { getReservist } from "../api/query/query";
import { reservistKeys } from "../constants/key";
import { ApiError } from "../../../common/error/api-error";

const useGetReservist = (reservistId: string, enabled: boolean) => {
  return useQuery({
    queryKey: reservistKeys.detail(reservistId),
    queryFn: () => getReservist(reservistId),
    staleTime: Infinity,
    enabled,
    retry: (failureCount, error) => {
      // Stop retrying if it's a 404 or 400
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 400)
      ) {
        return false;
      }

      return failureCount < 3;
    },
  });
};

export default useGetReservist;
