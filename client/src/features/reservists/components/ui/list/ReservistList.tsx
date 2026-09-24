import ReservistCard from "./ReservistCard";
import type { ReservistView } from "../../types";

type ReservistListProps = {
  reservists: ReservistView[];
};

const ReservistList = ({ reservists }: ReservistListProps) => {
  return (
    <div className="flex w-full flex-col gap-3">
      {reservists.map((reservist) => (
        <ReservistCard key={reservist.id} reservist={reservist} />
      ))}
    </div>
  );
};

export default ReservistList;
