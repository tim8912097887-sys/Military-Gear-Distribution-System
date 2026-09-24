import InfoRow from "../../../../../components/ui/common/InfoRow";
import { formatDateTime } from "../../../utils/format-date-time";
import type { ReservistView } from "../../types";

type ReservistDetailInfoProps = { reservist: ReservistView };

const ReservistDetailInfo = ({ reservist }: ReservistDetailInfoProps) => {
  return (
    <div className="px-6 py-6 sm:px-8">
      <div className="divide-y divide-slate-700/70 rounded-xl border border-slate-700/70">
        <InfoRow label="National ID">{reservist.nationalId}</InfoRow>

        <InfoRow label="Military rank">{reservist.militaryRank}</InfoRow>

        <InfoRow label="Check-in time">
          {reservist.checkedInAt
            ? formatDateTime(reservist.checkedInAt)
            : "Not checked in"}
        </InfoRow>

        <InfoRow label="Created at">
          {formatDateTime(reservist.createdAt)}
        </InfoRow>
      </div>
    </div>
  );
};

export default ReservistDetailInfo;
