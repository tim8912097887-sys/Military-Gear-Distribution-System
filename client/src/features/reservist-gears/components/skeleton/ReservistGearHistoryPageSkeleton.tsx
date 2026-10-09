import PageContainer from "../../../../common/components/pages/PageContainer";
import ReservistGearHistorySkeleton from "./ReservistGearHistorySkeleton";

const ReservistGearHistoryPageSkeleton = () => {
  return (
    <PageContainer
      title="Gear Distribution History"
      description="Review gear issuance and return records for a reservist."
      path={`/reservists/skeleton/gears/history`}
      noIndex
    >
      <ReservistGearHistorySkeleton />
    </PageContainer>
  );
};

export default ReservistGearHistoryPageSkeleton;
