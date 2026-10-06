import type { GearStatusResponse } from "../../../../types";

type ReservistGearHoldingsProps = {
  holdings: GearStatusResponse["holdings"];
};

const ReservistGearHoldings = ({ holdings }: ReservistGearHoldingsProps) => {
  const { bulk, serialized } = holdings;

  const hasHoldings = bulk.length > 0 || serialized.length > 0;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/20">
      <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-slate-100">
          Current holdings
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Gear currently assigned to this reservist.
        </p>
      </div>

      {!hasHoldings ? (
        <div className="px-5 py-10 text-center sm:px-6">
          <p className="text-sm font-medium text-slate-300">No gear issued</p>

          <p className="mt-1 text-sm text-slate-500">
            This reservist currently has no gear assigned.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {bulk.map((item) => (
            <div key={item.inventoryItemId} className="px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-slate-200">
                    {item.categoryName}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Size {item.size}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-sm font-medium text-slate-200">
                    Quantity: {item.quantity}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Issued {new Date(item.issuedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {serialized.map((item) => (
            <div key={item.custodyId} className="px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-slate-200">
                    {item.categoryName}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Serial: {item.serialNumber}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Size {item.size}
                  </p>
                </div>

                <p className="text-xs text-slate-500 sm:text-right">
                  Issued {new Date(item.issuedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ReservistGearHoldings;
