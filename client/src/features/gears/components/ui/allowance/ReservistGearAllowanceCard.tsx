import type { GearAllowanceView } from "../../../types";

const ReservistGearAllowanceCard = ({
  allowance,
}: {
  allowance: GearAllowanceView;
}) => {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-800/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-slate-100">
            {allowance.categoryName}
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            {allowance.trackingType === "BULK" ? "Bulk" : "Serialized"}
          </p>
        </div>

        <span className="text-sm font-semibold text-slate-300">
          {allowance.held} / {allowance.limit}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        {allowance.remaining === 0
          ? "Allowance reached"
          : `${allowance.remaining} remaining`}
      </p>
    </div>
  );
};

export default ReservistGearAllowanceCard;
