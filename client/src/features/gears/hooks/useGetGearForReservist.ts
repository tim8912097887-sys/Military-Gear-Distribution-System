import { useQuery } from "@tanstack/react-query";
import { getGearForReservist } from "../api/query/query";
import { reservistGearKeys } from "../constants/key";

export function useGetGearForReservist(reservistId: string) {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: reservistGearKeys.all(reservistId),
    queryFn: () => {
      return getGearForReservist(reservistId);
    },
  });

  return { data, isPending, isError, error, refetch };
}
