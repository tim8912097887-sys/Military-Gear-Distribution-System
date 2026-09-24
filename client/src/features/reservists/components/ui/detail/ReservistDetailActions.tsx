import Button from "../../../../../components/ui/common/Button";
import type { ReservistView } from "../../types";

type ReservistDetailActionsProps = {
  isCheckingIn: boolean;
  reservist: ReservistView;
  onCheckIn: () => void;
};

const ReservistDetailActions = ({
  isCheckingIn,
  reservist,
  onCheckIn,
}: ReservistDetailActionsProps) => {
  const isCheckedIn = Boolean(reservist.checkedInAt);
  return (
    <div className="flex flex-col gap-3 border-t border-slate-700/80 bg-slate-800/60 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
      {isCheckedIn ? (
        <Button variant="disabled" disabled>
          Already checked in
        </Button>
      ) : (
        <Button
          variant="success"
          size="md"
          loading={isCheckingIn}
          loadingText="Checking in..."
          onClick={onCheckIn}
        >
          Check in reservist
        </Button>
      )}
    </div>
  );
};

export default ReservistDetailActions;
