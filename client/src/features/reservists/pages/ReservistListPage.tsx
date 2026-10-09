import { useState } from "react";
import ReservistListHeader from "../components/ui/list/ReservistListHeader";
import useGetReservists from "../hooks/useGetReservists";
import ReservistListPanel from "../components/ui/list/ReservistListPanel";
import useDebounce from "../hooks/useDebounce";
import PageContainer from "../../../common/components/pages/PageContainer";

const ReservistListPage = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce({ delay: 500, value: search });

  const {
    reservists,
    hasInitialError,
    hasNextPageError,
    isInitialLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useGetReservists(debouncedSearch);

  return (
    <PageContainer
      title="Reservist Management"
      description="Manage reservist records and check-in status for education recall gear distribution."
      path="/reservists"
      noIndex
    >
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
    </PageContainer>
  );
};

export default ReservistListPage;
