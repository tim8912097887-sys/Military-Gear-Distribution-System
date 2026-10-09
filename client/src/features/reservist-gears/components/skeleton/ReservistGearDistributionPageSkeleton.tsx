import BackNavigation from "../../../../common/components/pages/BackNavigation";
import PageContainer from "../../../../common/components/pages/PageContainer";
import PageHeader from "../../../../common/components/pages/PageHeader";
import ReservistGearPageSkeleton from "./ReservistGearPageSkeleton";

const ReservistGearDistributionPageSkeleton = () => {
  return (
    <PageContainer
      title="Reservist Details"
      description="View reservist information and manage check-in status."
      path={`/reservists/skeleton/gears`}
      noIndex
    >
      <BackNavigation to="/reservists" />
      <PageHeader title="Gear Distribution" subtitle="Issue and return gear" />
      <section aria-hidden="true">
        <ReservistGearPageSkeleton />
      </section>
    </PageContainer>
  );
};

export default ReservistGearDistributionPageSkeleton;
