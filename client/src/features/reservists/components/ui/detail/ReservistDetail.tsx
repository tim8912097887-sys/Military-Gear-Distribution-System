import type { ReservistView } from "../../types";
import ReservistDetailActions from "./ReservistDetailActions";
import ReservistDetailHeader from "./ReservistDetailHeader";
import ReservistDetailInfo from "./ReservistDetailInfo";

type ReservistDetailProps = {
  onCheckIn: () => void;
  isCheckingIn: boolean;
  reservist: ReservistView;
};

const ReservistDetail = ({
  reservist,
  onCheckIn,
  isCheckingIn,
}: ReservistDetailProps) => {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-800 shadow-xl">
        <ReservistDetailHeader reservist={reservist} />

        <ReservistDetailInfo reservist={reservist} />

        <ReservistDetailActions
          isCheckingIn={isCheckingIn}
          reservist={reservist}
          onCheckIn={onCheckIn}
        />
      </div>
    </div>
  );
};

export default ReservistDetail;
