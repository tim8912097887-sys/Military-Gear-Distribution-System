import { INITIAL_LIMIT } from "../constants";
import ReservistCard from "./ReservistCard";
import { LoadMoreButtonSkeleton } from "../skeleton/LoadMoreButtonSkeleton";
import { ReservistCardSkeleton } from "../skeleton/ReservistCardSkeleton";
import type { ReservistView } from "../types";

type ReservistListProps = {
  reservists: ReservistView[];
  isInitialLoading?: boolean;
};

const ReservistList = ({
  reservists,
  isInitialLoading = false,
}: ReservistListProps) => {
  if (isInitialLoading && reservists.length === 0) {
    return (
      <div className="flex w-full flex-col gap-3">
        {[...Array(INITIAL_LIMIT)].map((_, i) => (
          <ReservistCardSkeleton key={i} />
        ))}
        <LoadMoreButtonSkeleton />
      </div>
    );
  }

  if (reservists.length === 0) {
    return (
      <div
        className="
          w-full rounded-xl
          border border-dashed border-white/10
          px-6 py-12
          text-slate-100
          text-center
        "
      >
        <p className="text-sm font-medium">No reservists found</p>

        <p className="mt-1 text-sm">Try a different name or national ID.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {reservists.map((reservist) => (
        <ReservistCard key={reservist.id} reservist={reservist} />
      ))}
    </div>
  );
};

export default ReservistList;
