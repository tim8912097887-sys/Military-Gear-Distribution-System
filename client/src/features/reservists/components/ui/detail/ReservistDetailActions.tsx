import { Link } from "react-router";
import Button from "../../../../../common/components/ui/common/Button";
import type { ReservistView } from "../../../types";
import { CornerUpRight } from "lucide-react";

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
        <Link
          to={`/reservists/${reservist.id}/gears`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 active:bg-indigo-700"
        >
          <span>View gear</span>
          <CornerUpRight className="h-4 w-4" />
        </Link>
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
