import { useInfiniteQuery } from "@tanstack/react-query";
import { listReservists } from "../api/query/query";
import { reservistKeys } from "../constants/key";
import { INCREMENT_LIMIT, INITIAL_LIMIT } from "../constants/limit";
import { ApiError } from "../../../common/error/api-error";

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
    staleTime: 60_000,
    retry: (failureCount, error) => {
      // Stop retrying if it's a 400
      if (error instanceof ApiError && error.status === 400) {
        return false;
      }

      return failureCount < 3;
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
