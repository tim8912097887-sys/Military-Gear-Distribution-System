import type { ReservistView } from "../../types";
import { ReservistStatusBadge } from "../ReservistStatusBadge";

type ReservistDetailHeaderProps = {
  reservist: ReservistView;
};
const ReservistDetailHeader = ({ reservist }: ReservistDetailHeaderProps) => {
  const isCheckedIn = Boolean(reservist.checkedInAt);
  return (
    <div className="border-b border-slate-700/80 px-6 py-6 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
              {reservist.name}
            </h1>

            <span className="rounded-md bg-slate-700 px-2.5 py-1 text-sm font-medium text-slate-300">
              {reservist.militaryRank}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-400">Reservist information</p>
        </div>

        <ReservistStatusBadge checkedIn={isCheckedIn} />
      </div>
    </div>
  );
};

export default ReservistDetailHeader;
