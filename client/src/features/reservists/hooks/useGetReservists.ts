import { useInfiniteQuery } from "@tanstack/react-query";
import {
  INCREMENT_LIMIT,
  INITIAL_LIMIT,
  reservistKeys,
} from "../constants/key";
import { listReservists } from "../api/query/query";

const useGetReservists = (search: string) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    error,
    isFetchNextPageError,
    isLoading: isInitialLoading,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: reservistKeys.list(search),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const response = await listReservists({
        q: search === "" ? undefined : search,
        cursor: pageParam,
        limit: pageParam === null ? INITIAL_LIMIT : INCREMENT_LIMIT,
      });

      return response;
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
  });

  const reservists = data?.pages.flatMap((page) => page.reservists) ?? [];

  const hasInitialError = !!error && !data;

  return {
    reservists,
    fetchNextPage,
    hasInitialError,
    hasNextPage,
    error,
    hasNextPageError: isFetchNextPageError,
    isInitialLoading,
    isFetchingNextPage,
    refetch,
  };
};

export default useGetReservists;
