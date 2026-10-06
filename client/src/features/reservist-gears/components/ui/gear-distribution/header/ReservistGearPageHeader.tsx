import type { GearStatusResponse } from "../../../../types";

type ReservistGearPageHeaderProps = {
  reservist: GearStatusResponse["reservist"];
};

const ReservistGearPageHeader = ({
  reservist,
}: ReservistGearPageHeaderProps) => {
  const isCheckedIn = reservist.checkedInAt !== null;

  return (
    <>
      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
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
