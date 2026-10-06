import type {
  GearStatusResponse,
  IssueGearInput,
  ReturnGearInput,
} from "../../../types";
import ReservistGearAllowance from "./allowance/ReservistGearAllowance";
import ReservistGearPageHeader from "./header/ReservistGearPageHeader";
import ReservistGearHoldings from "./holding/ReservistGearHoldings";
import IssueGearPanel from "./issue/IssueGearPanel";
import ReturnGearPanel from "./return/ReturnGearPanel";

type ReservistGearDistributionContentProps = {
  gear: GearStatusResponse;
  issueMutation: {
    isPending: boolean;
    mutateAsync: (input: IssueGearInput) => Promise<GearStatusResponse>;
  };
  returnMutation: {
    isPending: boolean;
    mutateAsync: (input: ReturnGearInput) => Promise<GearStatusResponse>;
  };
};

const ReservistGearDistributionContent = ({
  gear,
  issueMutation,
  returnMutation,
}: ReservistGearDistributionContentProps) => {
  return (
    <>
      <ReservistGearPageHeader reservist={gear.reservist} />

      <div className="mt-6 space-y-6">
        <ReservistGearHoldings holdings={gear.holdings} />

        <ReservistGearAllowance allowance={gear.allowance} />

        <IssueGearPanel
          availability={gear.availability}
          isMutating={issueMutation.isPending || returnMutation.isPending}
          isCheckedIn={gear.reservist.checkedInAt !== null}
          onSubmit={(input) => issueMutation.mutateAsync(input)}
        />

        <ReturnGearPanel
          holdings={gear.holdings}
          isMutating={returnMutation.isPending || issueMutation.isPending}
          isCheckedIn={gear.reservist.checkedInAt !== null}
          onSubmit={(input) => returnMutation.mutateAsync(input)}
        />
      </div>
    </>
  );
};

export default ReservistGearDistributionContent;
