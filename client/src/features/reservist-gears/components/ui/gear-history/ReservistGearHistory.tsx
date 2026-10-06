import { Link } from "react-router";
import type { GearHistoryResponse } from "../../../types";
import GearHistoryTable from "./GearHistoryTable";
import GearHistoryCard from "./GearHistoryCard";
import GearHistoryPagination from "./GearHistoryPagination";
import GearHistoryEmpty from "./GearHistoryEmpty";
import GearHistoryPaginationError from "../../error/GearHistoryPaginationError";

type ReservistGearHistoryProps = {
  data: GearHistoryResponse;
  offset: number;
  onOffsetChange: (offset: number) => void;
  backRoute: string;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
};

export const ReservistGearHistory = ({
  data,
  offset,
  onOffsetChange,
  backRoute,
  isPending,
  isError,
  isFetching,
  refetch,
}: ReservistGearHistoryProps) => {
  const limit = data.pagination.limit;
  const currentPage = Math.floor(offset / limit) + 1;
  const hasPrevious = offset > 0;
  const hasNext = data.pagination.hasMore;
  const isPageNavigating = isPending || isFetching;

  const goPrevious = () => {
    if (!hasPrevious) return;

    onOffsetChange(Math.max(0, offset - limit));
  };

  const goNext = () => {
    if (!hasNext) return;

    onOffsetChange(offset + limit);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <Link
          to={backRoute}
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-200"
        >
          <span aria-hidden="true">←</span>
          Back to gear
        </Link>

        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            Gear History
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            View gear issue and return records for this reservist.
          </p>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/20">
        {isError && offset > 0 && (
          <GearHistoryPaginationError onRetry={refetch} />
        )}
        {isFetching && !isPending && (
          <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-2 sm:px-6">
            <p className="text-xs text-slate-500">Loading history...</p>
          </div>
        )}
        {!isPending && !isError && data.history.length === 0 ? (
          <GearHistoryEmpty />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <GearHistoryTable history={data.history} />
            </div>

            <div className="divide-y divide-slate-800 md:hidden">
              {data.history.map((item) => (
                <GearHistoryCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}

        <GearHistoryPagination
          currentPage={currentPage}
          total={data.pagination.total}
          limit={limit}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={goPrevious}
          onNext={goNext}
          isNavigating={isPageNavigating}
        />
      </section>
    </div>
  );
};

export default ReservistGearHistory;
