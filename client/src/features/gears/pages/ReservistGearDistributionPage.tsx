import { useParams } from "react-router";
import { reservistIdSchema } from "../../../common/schema/reservist-id";
import ReservistGearDistributionContent from "../components/ui/ReservistGearDistributionContent";
import ReservistGearPageInvalidId from "../components/error/ReservistGearPageInvalidId";

const ReservistGearDistributionPage = () => {
  const { id } = useParams();

  const result = reservistIdSchema.safeParse(id);

  if (!result.success) {
    return <ReservistGearPageInvalidId />;
  }
  return <ReservistGearDistributionContent reservistId={result.data} />;
};

export default ReservistGearDistributionPage;
