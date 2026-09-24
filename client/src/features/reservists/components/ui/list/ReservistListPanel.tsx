import { INITIAL_LIMIT } from "../../../constants/key";
import ReservistListInitialError from "../../error/ReservistListInitialError";
import ReservistNextPageError from "../../error/ReservistNextPageError";
import { ReservistCardSkeleton } from "../../skeleton/ReservistCardSkeleton";
import type { ReservistView } from "../../types";
import ReservistList from "./ReservistList";
import { SearchBar } from "./SearchBar";

type ReservistListPanelProps = {
  reservists: ReservistView[];
  hasNextPage: boolean;
  hasNextPageError: boolean;
  isInitialLoading: boolean;
  hasInitialError: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  search: string;
  setSearch: (value: string) => void;
};

const ReservistListPanel = ({
  reservists,
  hasNextPage,
  hasNextPageError,
  isInitialLoading,
  hasInitialError,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  search,
  setSearch,
}: ReservistListPanelProps) => {
  return (
    <section
      className="
            overflow-hidden
            rounded-2xl
            border border-slate-800
            bg-slate-900
            shadow-xl shadow-black/20
          "
    >
      {/* Search */}
      <div className="border-b border-slate-800 bg-slate-900 p-4 sm:p-5">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <div className="text-slate-100">
          <p className="text-sm font-semibold">Reservist records</p>

          {!isInitialLoading && !hasInitialError && (
            <p className="mt-0.5 text-xs text-slate-400">
              {reservists.length} loaded
            </p>
          )}
        </div>

        {hasNextPage && !isInitialLoading && !hasInitialError && (
          <span className="text-xs text-slate-400">More records available</span>
        )}
      </div>

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        {/* Initial loading */}
        {isInitialLoading && (
          <div className="space-y-3">
            {[...Array(INITIAL_LIMIT)].map((_, i) => (
              <ReservistCardSkeleton key={i} />
            ))}
          </div>
        )}

        {hasInitialError && <ReservistListInitialError onRetry={refetch} />}

        {/* Loaded content */}
        {!isInitialLoading && !hasInitialError && (
          <>
            {/* Empty state */}
            {reservists.length === 0 && (
              <div
                className="
                      rounded-xl
                      border border-slate-800
                      bg-slate-950/40
                      px-5 py-10
                      text-center
                    "
              >
                <h3 className="text-sm font-semibold text-slate-100">
                  No reservists found
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  {search
                    ? "Try a different search term."
                    : "There are no reservist records yet."}
                </p>
              </div>
            )}

            {/* Reservist list */}
            {reservists.length > 0 && <ReservistList reservists={reservists} />}

            {/* Next page loading */}
            {isFetchingNextPage && (
              <div className="mt-3 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <ReservistCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Next page error */}
            {hasNextPageError && !isFetchingNextPage && (
              <ReservistNextPageError onRetry={fetchNextPage} />
            )}

            {/* Load more */}
            {hasNextPage && !isFetchingNextPage && !hasNextPageError && (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="
                        mt-4
                        w-full
                        rounded-xl
                        border border-slate-800
                        bg-slate-700
                        px-4 py-3
                        text-sm font-semibold
                        text-slate-100
                        transition
                        hover:bg-slate-800
                        focus:outline-none
                        focus:ring-2
                        focus:ring-slate-500
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
              >
                Load more reservists
              </button>
            )}

            {/* End of list */}
            {!hasNextPage && reservists.length > 0 && (
              <p className="mt-4 text-center text-xs text-slate-500">
                You've reached the end of the list.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ReservistListPanel;
