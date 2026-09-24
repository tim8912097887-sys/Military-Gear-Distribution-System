import { useState } from "react";
import ReservistListHeader from "../components/ui/list/ReservistListHeader";
import useGetReservists from "../hooks/useGetReservists";
import ReservistListPanel from "../components/ui/list/ReservistListPanel";

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
  } = useGetReservists(search);

  const reservists = data?.pages.flatMap((page) => page.reservists) ?? [];

  const hasInitialError = !!error && !data;
  const hasNextPageError = isFetchNextPageError;

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <ReservistListHeader />

        <ReservistListPanel
          reservists={reservists}
          hasNextPage={hasNextPage}
          hasNextPageError={hasNextPageError}
          isInitialLoading={isInitialLoading}
          hasInitialError={hasInitialError}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          refetch={refetch}
          search={search}
          setSearch={setSearch}
        />
      </div>
    </main>
  );
};

export default ReservistListPage;
