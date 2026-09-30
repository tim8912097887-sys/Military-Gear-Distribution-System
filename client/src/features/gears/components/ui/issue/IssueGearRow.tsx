import type { GearAvailabilityResponse } from "../../../types";

type IssueGearRowProps = {
  item: GearAvailabilityResponse;
  selectedBulk: Record<string, number>;
  selectedSerialized: Set<string>;
  onBulkQuantityChange: (
    inventoryItemId: string,
    categoryId: string,
    quantity: number,
  ) => void;
  onSerializedToggle: (serialNumber: string, categoryId: string) => void;
};

const IssueGearRow = ({
  item,
  selectedBulk,
  selectedSerialized,
  onBulkQuantityChange,
  onSerializedToggle,
}: IssueGearRowProps) => {
  return (
    <div className="px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            {item.categoryName}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Remaining allowance: {item.remainingAllowance}
          </p>
        </div>

        <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300">
          {item.trackingType === "BULK" ? "Bulk" : "Serialized"}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {item.trackingType === "BULK"
          ? item.sizes.map((sizeItem) => {
              const quantity = selectedBulk[sizeItem.inventoryItemId] ?? 0;

              return (
                <div
                  key={sizeItem.inventoryItemId}
                  className="
                  flex items-center justify-between gap-4
                  rounded-lg border border-slate-800 bg-slate-950/50
                  px-4 py-3
                "
                >
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200">
                      {sizeItem.size ?? "One size"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {sizeItem.availableQuantity} available
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`quantity-${sizeItem.inventoryItemId}`}
                      className="sr-only"
                    >
                      Quantity
                    </label>

                    <input
                      id={`quantity-${sizeItem.inventoryItemId}`}
                      type="number"
                      min={0}
                      max={sizeItem.availableQuantity}
                      value={quantity || ""}
                      onChange={(event) => {
                        const next = Number(event.target.value);

                        if (!Number.isFinite(next)) {
                          return;
                        }

                        onBulkQuantityChange(
                          sizeItem.inventoryItemId,
                          item.categoryId,
                          Math.min(
                            sizeItem.availableQuantity,
                            Math.max(0, next),
                          ),
                        );
                      }}
                      className="
                      w-20 rounded-lg border border-slate-700
                      bg-slate-900 px-3 py-2 text-right text-sm
                      text-slate-100 outline-none
                      focus:border-amber-500 focus:ring-1 focus:ring-amber-500
                    "
                    />
                  </div>
                </div>
              );
            })
          : item.sizes.map((sizeItem) => {
              const checked = selectedSerialized.has(sizeItem.serialNumber);

              return (
                <label
                  key={sizeItem.serialNumber}
                  className="
                flex cursor-pointer items-center justify-between gap-4
                rounded-lg border border-slate-800 bg-slate-950/50
                px-4 py-3 transition
                hover:border-slate-700
              "
                >
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200">
                      {sizeItem.size ?? "One size"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Serial: {sizeItem.serialNumber}
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onSerializedToggle(sizeItem.serialNumber, item.categoryId)
                    }
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500"
                  />
                </label>
              );
            })}
      </div>
    </div>
  );
};

export default IssueGearRow;
