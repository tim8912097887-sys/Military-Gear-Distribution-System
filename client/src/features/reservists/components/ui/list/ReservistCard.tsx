import { Link } from "react-router";
import type { ReservistView } from "../../types";
import { ChevronRight } from "lucide-react";
import { ReservistStatusBadge } from "../ReservistStatusBadge";

type ReservistCardProps = {
  reservist: ReservistView;
};

export function ReservistCard({ reservist }: ReservistCardProps) {
  const isCheckedIn = Boolean(reservist.checkedInAt);

  return (
    <Link
      to={`/reservists/${reservist.id}`}
      className="
        group block w-full
        rounded-xl border border-white/10
        p-4
        shadow-lg
        transition
        hover:shadow-xl
        text-slate-100
        focus:outline-none
        focus:ring-2
      "
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="truncate font-semibold">{reservist.name}</h3>

            <span
              className="
                rounded-md border border-white/10
                bg-black/10 px-2 py-0.5
                font-mono text-xs
              "
            >
              {reservist.militaryRank}
            </span>
          </div>

          <p className="mt-1 font-mono text-sm tracking-wide">
            {reservist.nationalId}
          </p>
        </div>

        <ChevronRight
          className="
            h-5 w-5 shrink-0
            transition-transform
            group-hover:translate-x-1
          "
        />
      </div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <ReservistStatusBadge checkedIn={isCheckedIn} />
      </div>
    </Link>
  );
}

export default ReservistCard;
