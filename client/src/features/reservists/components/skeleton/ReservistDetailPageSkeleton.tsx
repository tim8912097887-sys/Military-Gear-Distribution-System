import BackNavigation from "../../../../common/components/pages/BackNavigation";
import PageContainer from "../../../../common/components/pages/PageContainer";
import PageHeader from "../../../../common/components/pages/PageHeader";
import ReservistDetailSkeleton from "./ReservistDetailSkeleton";

const ReservistDetailPageSkeleton = () => {
  return (
    <PageContainer
      title="Reservist Details"
      description="View reservist information and manage check-in status."
      path={`/reservists/skeleton`}
      noIndex
    >
      <BackNavigation to="/reservists" />
      <PageHeader
        title="Reservist details"
        subtitle="View reservist information and check-in status."
      />

      <section aria-live="polite">
        <ReservistDetailSkeleton />
      </section>
    </PageContainer>
  );
};

export default ReservistDetailPageSkeleton;
