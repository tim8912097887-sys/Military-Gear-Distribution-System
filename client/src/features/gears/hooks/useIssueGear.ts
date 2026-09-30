import { useMutation, useQueryClient } from "@tanstack/react-query";
import { issueGear } from "../api/query/query";
import type { IssueGearInput } from "../types";
import { toast } from "react-toastify";
import { reservistGearKeys } from "../constants/key";

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
        queryKey: reservistGearKeys.history(reservistId),
      });
      toast.success("Reservist issued successfully");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });
}
