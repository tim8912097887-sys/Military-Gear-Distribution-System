import { useParams } from "react-router";
import PageContainer from "../../../common/components/pages/PageContainer";
import { useGetGearHistoryForReservist } from "../hooks/useGetGearHistoryForReservist";
import { reservistIdSchema } from "../../../common/schema/reservist-id";
import ReservistGearPageInvalidId from "../components/error/ReservistGearPageInvalidId";
import ReservistGearHistorySkeleton from "../components/skeleton/ReservistGearHistorySkeleton";
import ReservistGearHistoryError from "../components/error/ReservistGearHistoryError";
import ReservistGearHistory from "../components/ui/gear-history/ReservistGearHistory";

export const ReservistGearHistoryPage = () => {
  const { id } = useParams();
  const result = reservistIdSchema.safeParse(id);
  const historyQuery = useGetGearHistoryForReservist(
    id as string,
    result.success,
  );

  const content = (() => {
    if (!result.success) {
      return <ReservistGearPageInvalidId />;
    }
    if (historyQuery.isPending) {
      return <ReservistGearHistorySkeleton />;
    }

    if (
      (historyQuery.isError || !historyQuery.data) &&
      historyQuery.offset === 0
    ) {
      return (
        <ReservistGearHistoryError
          error={historyQuery.error}
          onRetry={historyQuery.refetch}
          backRoute={`/reservists/${id}/gears`}
        />
      );
    }

    return (
      <ReservistGearHistory
        data={
          historyQuery.data || {
            history: [
              {
                id: "",
                actionType: "ISSUE",
                categoryName: "",
                size: "",
                serialNumber: null,
                quantity: 0,
                createdAt: new Date().toISOString(),
              },
            ],
            pagination: { hasMore: false, total: 0, limit: 0 },
          }
        }
        offset={historyQuery.offset}
        onOffsetChange={historyQuery.setOffset}
        backRoute={`/reservists/${id}/gears`}
        isPending={historyQuery.isPending}
        isError={historyQuery.isError}
        isFetching={historyQuery.isFetching}
        refetch={historyQuery.refetch}
      />
    );
  })();

  return (
    <PageContainer
      title="Gear Distribution History"
      description="Review gear issuance and return records for a reservist."
      path={`/reservists/${id}/gears/history`}
      noIndex
    >
      {content}
    </PageContainer>
  );
};

export default ReservistGearHistoryPage;
