import { useParams } from "react-router";
import { reservistIdSchema } from "../../../common/schema/reservist-id";
import ReservistGearDistributionContent from "../components/ui/ReservistGearDistributionContent";
import ReservistGearPageInvalidId from "../components/error/ReservistGearPageInvalidId";
import PageContainer from "../../../common/components/pages/PageContainer";
import { useGetGearForReservist } from "../hooks/useGetGearForReservist";
import { useIssueGear } from "../hooks/useIssueGear";
import { useReturnGear } from "../hooks/useReturnGear";
import ReservistGearPageError from "../components/error/ReservistGearPageError";
import ReservistGearPageSkeleton from "../components/skeleton/ReservistGearPageSkeleton";
import BackNavigation from "../../../common/components/pages/BackNavigation";
import PageHeader from "../../../common/components/pages/PageHeader";

const ReservistGearDistributionPage = () => {
  const { id } = useParams();

  const result = reservistIdSchema.safeParse(id);

  const gearQuery = useGetGearForReservist(id as string, result.success);

  const issueMutation = useIssueGear(id as string);
  const returnMutation = useReturnGear(id as string);

  const content = (() => {
    if (!result.success) {
      return <ReservistGearPageInvalidId />;
    }
    if (gearQuery.isPending) {
      return <ReservistGearPageSkeleton />;
    }

    if (gearQuery.isError || !gearQuery.data) {
      return (
        <ReservistGearPageError
          error={gearQuery.error}
          onRetry={() => gearQuery.refetch()}
        />
      );
    }

    return (
      <ReservistGearDistributionContent
        gear={gearQuery.data}
        issueMutation={issueMutation}
        returnMutation={returnMutation}
      />
    );
  })();

  return (
    <PageContainer>
      <BackNavigation to={`/reservists/${id}`} />
      <PageHeader title="Gear Distribution" subtitle="Issue and return gear" />
      <section>{content}</section>
    </PageContainer>
  );
};

export default ReservistGearDistributionPage;
