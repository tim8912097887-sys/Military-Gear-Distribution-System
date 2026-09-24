import { useState } from "react";
import ReservistList from "../components/ReservistList";
import ReservistHeader from "../components/ReservistHeader";
import { SearchBar } from "../components/SearchBar";
import { ReservistCardSkeleton } from "../components/skeleton/ReservistCardSkeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import { listReservists } from "../api/query/query";
import { INITIAL_LIMIT } from "../components/constants";

const ReservistListPage = () => {
  const [search, setSearch] = useState("");

  const {
    data,
    error,
    isFetchNextPageError,
    isLoading: isInitialLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["reservistslistpage", search],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const response = await listReservists({
        q: search,
        cursor: pageParam,
        limit: INITIAL_LIMIT,
      });

      return response;
    },
    retry: false,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
  });

  const reservists = data?.pages.flatMap((page) => page.reservists) ?? [];

  const hasInitialError = !!error && !data;
  const hasNextPageError = isFetchNextPageError;

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <ReservistHeader />

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
              <span className="text-xs text-slate-400">
                More records available
              </span>
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

            {/* Initial error */}
            {hasInitialError && (
              <div
                className="
                  rounded-xl
                  border border-red-900/50
                  bg-red-950/30
                  px-5 py-8
                  text-center
                "
              >
                <div
                  className="
                    mx-auto mb-3 flex h-10 w-10
                    items-center justify-center
                    rounded-full
                    bg-red-900/40
                    text-red-400
                  "
                >
                  !
                </div>

                <h3 className="text-sm font-semibold text-slate-100">
                  Unable to load reservists
                </h3>

                <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                  We couldn't load the reservist records. Please check your
                  connection and try again.
                </p>

                <button
                  type="button"
                  onClick={() => refetch()}
                  className="
                    mt-5 rounded-lg
                    border border-slate-700
                    bg-slate-800
                    px-4 py-2
                    text-sm font-medium
                    text-slate-100
                    transition
                    hover:bg-slate-700
                    focus:outline-none
                    focus:ring-2
                    focus:ring-slate-500
                  "
                >
                  Try again
                </button>
              </div>
            )}

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
                {reservists.length > 0 && (
                  <ReservistList
                    reservists={reservists}
                    isInitialLoading={false}
                  />
                )}

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
                  <div
                    className="
                      mt-4
                      rounded-xl
                      border border-red-900/50
                      bg-red-950/20
                      px-4 py-4
                    "
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-100">
                          Couldn't load more reservists
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Your existing records are still available.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => fetchNextPage()}
                        className="
                          shrink-0
                          rounded-lg
                          border border-slate-700
                          bg-slate-800
                          px-4 py-2
                          text-sm font-medium
                          text-slate-100
                          transition
                          hover:bg-slate-700
                          focus:outline-none
                          focus:ring-2
                          focus:ring-slate-500
                        "
                      >
                        Try again
                      </button>
                    </div>
                  </div>
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
      </div>
    </main>
  );
};

export default ReservistListPage;
