import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkInReservist } from "../api/query/query";
import { toast } from "react-toastify";
import { reservistKeys } from "../constants/key";
import { ApiError } from "../../../common/error/api-error";

export function useCheckInReservist(reservistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => checkInReservist(reservistId),

    onSuccess: (updatedReservist) => {
      queryClient.setQueryData(
        reservistKeys.detail(reservistId),
        updatedReservist,
      );
      queryClient.invalidateQueries({
        queryKey: reservistKeys.lists(),
      });

      toast.success("Reservist checked in successfully");
    },

    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
        return;
      }
      toast.error("An unexpected error occurred");
    },
  });
}
