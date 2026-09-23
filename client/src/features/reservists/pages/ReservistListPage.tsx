import { useState, useEffect, useCallback } from "react";
import ReservistList from "../components/ReservistList";
import ReservistHeader from "../components/ReservistHeader";
import { SearchBar } from "../components/SearchBar";
import { ReservistCardSkeleton } from "../components/skeleton/ReservistCardSkeleton";

export type ReservistView = {
  id: string;
  nationalId: string;
  name: string;
  militaryRank: string;
  checkedInAt: string | null;
  createdAt: string;
};

const fakeReservists: ReservistView[] = Array.from({ length: 20 }, (_, i) => {
  const pad = (num: number) => String(num).padStart(2, "0");
  const index = i + 1;
  return {
    id: String(index),
    nationalId: `A1234567${pad(index)}`,
    name: `Reservist ${index}`,
    militaryRank:
      index % 3 === 0 ? "Sergeant" : index % 2 === 0 ? "Corporal" : "Private",
    checkedInAt: index % 2 === 0 ? `2024-01-${pad(index)}T08:00:00.000Z` : null,
    createdAt: `2024-01-${pad(index)}T00:00:00.000Z`,
  };
});

const getReservists = async ({
  search,
  cursor,
  limit = 5,
  isCheckedIn,
}: {
  search?: string;
  cursor: string | null;
  limit?: number;
  isCheckedIn?: boolean;
}) => {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  const filtered = fakeReservists
    .filter((r) => {
      if (isCheckedIn !== undefined) {
        return isCheckedIn === (r.checkedInAt !== null);
      }
      return true;
    })
    .filter((r) => {
      if (search) {
        return (
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.nationalId.toLowerCase().includes(search.toLowerCase())
        );
      }
      return true;
    })
    .filter((r) => {
      if (cursor) {
        return r.createdAt > cursor;
      }
      return true;
    });

  // Fetch limit + 1 to check if another page exists
  const sliced = filtered.slice(0, limit + 1);
  const hasMore = sliced.length > limit;

  // Trim to the actual requested limit
  const data = hasMore ? sliced.slice(0, limit) : sliced;
  const nextCursor = data.length > 0 ? data[data.length - 1].createdAt : null;

  return {
    data,
    hasMore,
    nextCursor,
  };
};

const ReservistListPage = () => {
  const [search, setSearch] = useState("");
  const [reservists, setReservists] = useState<ReservistView[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);

  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadInitial = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const response = await getReservists({
        search: search.trim() || undefined,
        cursor: null,
        limit: 3,
      });

      setReservists(response.data);
      setCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } finally {
      setIsInitialLoading(false);
    }
  }, [search]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isInitialLoading) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const response = await getReservists({
        search: search.trim() || undefined,
        cursor,
        limit: 3,
      });

      setReservists((previous) => [...previous, ...response.data]);
      setCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, isInitialLoading, search, cursor]);

  useEffect(() => {
    async function initialLoad() {
      await loadInitial();
    }

    initialLoad();
  }, [loadInitial]);

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
          <div className="border-b border-slate-800 bg-slate-900 p-4 sm:p-5">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          <div className="flex items-center justify-between px-4 py-3 sm:px-5">
            <div className="text-slate-100">
              <p className="text-sm font-semibold">Reservist records</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {reservists.length} loaded
              </p>
            </div>

            {hasMore && !isInitialLoading && (
              <span className="text-xs text-slate-400">
                More records available
              </span>
            )}
          </div>

          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <ReservistList
              reservists={reservists}
              isLoading={isInitialLoading}
            />

            {isLoadingMore && (
              <div className="mt-3">
                {[...Array(3)].map((_, i) => (
                  <ReservistCardSkeleton key={i} />
                ))}
              </div>
            )}

            {hasMore && !isInitialLoading && !isLoadingMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="
                mt-4 w-full rounded-xl
                border border-slate-800
                bg-slate-700
                px-4 py-3
                text-sm font-semibold
                text-slate-100
                transition
                hover:bg-slate-800
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              >
                "Load more reservists"
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ReservistListPage;
