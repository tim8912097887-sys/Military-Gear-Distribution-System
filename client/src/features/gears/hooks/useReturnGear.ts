import { useMutation, useQueryClient } from "@tanstack/react-query";
import { returnGear } from "../api/query/query";
import type { ReturnGearInput } from "../types";
import { toast } from "react-toastify";
import { reservistGearKeys } from "../constants/key";

export function useReturnGear(reservistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (returnGearInput: ReturnGearInput) =>
      returnGear(reservistId, returnGearInput),

    onSuccess: (updatedGearStatus) => {
      queryClient.setQueryData(
        reservistGearKeys.all(reservistId),
        updatedGearStatus,
      );
      queryClient.invalidateQueries({
        queryKey: reservistGearKeys.history(reservistId),
      });
      toast.success("Reservist returned successfully");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });
}
