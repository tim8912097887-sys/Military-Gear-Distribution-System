import { useMutation, useQueryClient } from "@tanstack/react-query";
import { issueGear } from "../api/query/query";
import type { IssueGearInput } from "../types";
import { toast } from "react-toastify";
import { reservistGearKeys } from "../constants/key";
import { ApiError } from "../../../common/error/api-error";

export function useIssueGear(reservistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (issueGearInput: IssueGearInput) =>
      issueGear(reservistId, issueGearInput),

    onSuccess: (updatedGearStatus) => {
      queryClient.setQueryData(
        reservistGearKeys.all(reservistId),
        updatedGearStatus,
      );
      queryClient.invalidateQueries({
        queryKey: reservistGearKeys.history(reservistId, 0),
      });
      toast.success("Reservist issued successfully");
    },

    onError: (error) => {
      // Invalidate the gear status query to ensure the UI reflects the latest state
      queryClient.invalidateQueries({
        queryKey: reservistGearKeys.all(reservistId),
      });
      if (error instanceof ApiError) {
        toast.error(error.message);
        return;
      }
      toast.error("An unexpected error occurred");
    },
  });
}
