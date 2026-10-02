import { useParams } from "react-router";
import ReservistDetail from "../components/ui/detail/ReservistDetail";
import ReservistDetailSkeleton from "../components/skeleton/ReservistDetailSkeleton";
import ReservistDetailError from "../components/error/ReservistDetailError";
import useGetReservist from "../hooks/useGetReservist";
import { useCheckInReservist } from "../hooks/useCheckInReservist";
import { reservistIdSchema } from "../../../common/schema/reservist-id";
import ReservistDetailIdError from "../components/error/ReservistDetailIdError";
import PageContainer from "../../../common/components/pages/PageContainer";
import BackNavigation from "../../../common/components/pages/BackNavigation";
import PageHeader from "../../../common/components/pages/PageHeader";

const ReservistDetailPage = () => {
  const { id } = useParams();
  const result = reservistIdSchema.safeParse(id);

  const { isPending, error, data, refetch } = useGetReservist(
    id as string,
    result.success,
  );

  const { isPending: isCheckingIn, mutate } = useCheckInReservist(id as string);

  const content = (() => {
    if (!result.success) {
      return <ReservistDetailIdError />;
    }
    if (isPending) {
      return <ReservistDetailSkeleton />;
    }

    if (!data || error) {
      return <ReservistDetailError error={error} onRetry={() => refetch()} />;
    }

    return (
      <ReservistDetail
        reservist={data}
        onCheckIn={mutate}
        isCheckingIn={isCheckingIn}
      />
    );
  })();

  return (
    <PageContainer>
      <BackNavigation to="/reservists" />

      <PageHeader
        title="Reservist details"
        subtitle="View reservist information and check-in status."
      />

      {/* Content */}
      <section aria-live="polite">{content}</section>
    </PageContainer>
  );
};

export default ReservistDetailPage;
