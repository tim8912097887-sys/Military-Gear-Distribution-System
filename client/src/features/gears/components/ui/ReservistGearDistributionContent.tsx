import { useGetGearForReservist } from "../../hooks/useGetGearForReservist";
import { useIssueGear } from "../../hooks/useIssueGear";
import { useReturnGear } from "../../hooks/useReturnGear";
import ReservistGearPageError from "../error/ReservistGearPageError";
import ReservistGearPageSkeleton from "../skeleton/ReservistGearPageSkeleton";
import IssueGearPanel from "./issue/IssueGearPanel";
import ReservistGearAllowance from "./allowance/ReservistGearAllowance";
import ReservistGearHoldings from "./holding/ReservistGearHoldings";
import ReservistGearPageHeader from "./header/ReservistGearPageHeader";
import ReturnGearPanel from "./return/ReturnGearPanel";

const ReservistGearDistributionContent = ({
  reservistId,
}: {
  reservistId: string;
}) => {
  const gearQuery = useGetGearForReservist(reservistId);

  const issueMutation = useIssueGear(reservistId);
  const returnMutation = useReturnGear(reservistId);

  if (gearQuery.isPending) {
    return <ReservistGearPageSkeleton />;
  }

  if (gearQuery.isError || !gearQuery.data) {
    return (
      <ReservistGearPageError
        error={gearQuery.error}
        onRetry={() => gearQuery.refetch()}
      />
    );
  }

  const gear = gearQuery.data;

  return (
    <main className="min-h-dvh bg-slate-950">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <ReservistGearPageHeader
          reservistId={reservistId}
          reservist={gear.reservist}
        />

        <div className="mt-6 space-y-6">
          <ReservistGearHoldings holdings={gear.holdings} />

          <ReservistGearAllowance allowance={gear.allowance} />

          <IssueGearPanel
            availability={gear.availability}
            isSubmitting={issueMutation.isPending}
            isCheckedIn={gear.reservist.checkedInAt !== null}
            onSubmit={(input) => issueMutation.mutateAsync(input)}
          />

          <ReturnGearPanel
            holdings={gear.holdings}
            isSubmitting={returnMutation.isPending}
            isCheckedIn={gear.reservist.checkedInAt !== null}
            onSubmit={(input) => returnMutation.mutateAsync(input)}
          />
        </div>
      </div>
    </main>
  );
};

export default ReservistGearDistributionContent;
