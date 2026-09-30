import { Link } from "react-router";
import type { GearStatusResponse } from "../../../types";

type ReservistGearPageHeaderProps = {
  reservistId: string;
  reservist: GearStatusResponse["reservist"];
};

const ReservistGearPageHeader = ({
  reservistId,
  reservist,
}: ReservistGearPageHeaderProps) => {
  const isCheckedIn = reservist.checkedInAt !== null;

  return (
    <>
      <Link
        to={`/reservists/${reservistId}`}
        className="
          inline-flex items-center gap-2 rounded-md
          text-sm font-medium text-slate-400
          transition hover:text-slate-100
          focus:outline-none focus:ring-2 focus:ring-slate-500/50
        "
      >
        <span aria-hidden="true">←</span>
        Back to reservist
      </Link>

      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-slate-400">
            Gear distribution
          </p>

          <span
            className={`
              inline-flex items-center gap-1.5 rounded-full
              px-2.5 py-1 text-xs font-medium
              ${
                isCheckedIn
                  ? "bg-emerald-400/10 text-emerald-400"
                  : "bg-slate-800 text-slate-400"
              }
            `}
          >
            <span aria-hidden="true">{isCheckedIn ? "●" : "○"}</span>
            {isCheckedIn ? "Checked in" : "Not checked in"}
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
          Gear distribution
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-medium text-slate-200">{reservist.name}</span>

          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>

          <span className="text-slate-400">{reservist.militaryRank}</span>
        </div>

        <p className="mt-2 text-sm text-slate-400">
          {reservist.checkedInAt !== null
            ? "Issue and return gear for this reservist."
            : "Please check in this reservist first."}
        </p>
      </div>
    </>
  );
};

export default ReservistGearPageHeader;
