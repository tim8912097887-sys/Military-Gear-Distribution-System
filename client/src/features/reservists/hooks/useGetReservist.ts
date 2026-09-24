import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../api/error/api-error";
import { getReservist } from "../api/query/query";
import { reservistKeys } from "../constants/key";

const useGetReservist = (reservistId: string) => {
  return useQuery({
    queryKey: reservistKeys.detail(reservistId),
    queryFn: () => getReservist(reservistId),
    retry: (failureCount, error) => {
      // Stop retrying if it's a 404
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }

      return failureCount < 3;
    },
  });
};

export default useGetReservist;
