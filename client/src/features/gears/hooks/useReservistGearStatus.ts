import type { IssueGearInput, ReturnGearInput } from "../types";
import { useGetGearForReservist } from "./useGetGearForReservist";
import { useIssueGear } from "./useIssueGear";
import { useReturnGear } from "./useReturnGear";

export function useReservistGearStatus(
  reservistId: string,
  issueGearInput: IssueGearInput,
  returnGearInput: ReturnGearInput,
) {
  const {
    data: getGearData,
    isPending: getGearIsPending,
    isError: getGearIsError,
    error: getGearError,
  } = useGetGearForReservist(reservistId);

  const {
    data: issueGearData,
    isPending: issueGearIsPending,
    isError: issueGearIsError,
    error: issueGearError,
  } = useIssueGear(reservistId, issueGearInput);

  const {
    data: returnGearData,
    isPending: returnGearIsPending,
    isError: returnGearIsError,
    error: returnGearError,
  } = useReturnGear(reservistId, returnGearInput);

  return {
    getGearData,
    getGearIsPending,
    getGearIsError,
    getGearError,
    issueGearData,
    issueGearIsPending,
    issueGearIsError,
    issueGearError,
    returnGearData,
    returnGearIsPending,
    returnGearIsError,
    returnGearError,
  };
}
