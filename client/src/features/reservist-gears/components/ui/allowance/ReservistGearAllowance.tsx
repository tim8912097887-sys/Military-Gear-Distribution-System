import type { GearStatusResponse } from "../../../types";
import ReservistGearAllowanceCard from "./ReservistGearAllowanceCard";

const ReservistGearAllowance = ({
  allowance,
}: {
  allowance: GearStatusResponse["allowance"];
}) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/20">
      <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-slate-100">Allowance</h2>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
        {allowance.map((item) => (
          <ReservistGearAllowanceCard key={item.categoryId} allowance={item} />
        ))}
      </div>
    </section>
  );
};

export default ReservistGearAllowance;
