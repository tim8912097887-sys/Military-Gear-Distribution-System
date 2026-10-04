import { useQuery } from "@tanstack/react-query";
import { getGearHistoryForReservist } from "../api/query/query";
import { useState } from "react";
import { reservistGearKeys } from "../constants/key";

export function useGetGearHistoryForReservist(reservistId: string) {
  const [offset, setOffset] = useState(0);

  const { data, isPending, isError, error } = useQuery({
    queryKey: reservistGearKeys.history(reservistId),
    queryFn: () => {
      const response = getGearHistoryForReservist(reservistId, {
        offset,
        limit: 5,
      });

      return response;
    },
    staleTime: 90_000,
  });

  return { data, offset, setOffset, isPending, isError, error };
}
