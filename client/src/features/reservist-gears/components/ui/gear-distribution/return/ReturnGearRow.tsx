import type {
  HeldBulkView,
  HeldSerializedView,
  ReturnCondition,
} from "../../../../types";

type ReturnGearRowProps = {
  holding: HeldBulkView | HeldSerializedView;
  quantity: number;
  condition: ReturnCondition;
  isSelected: boolean;
  onQuantityChange: (quantity: number) => void;
  onConditionChange: (condition: ReturnCondition) => void;
  onSelectedChange: () => void;
};

const ReturnGearRow = ({
  holding,
  quantity,
  condition,
  onQuantityChange,
  onConditionChange,
  onSelectedChange,
  isSelected,
}: ReturnGearRowProps) => {
  const isBulk = "quantity" in holding;

  return (
    <div
      data-testid="return-gear-row"
      className="
        flex flex-col gap-4 rounded-lg border border-slate-800
        bg-slate-950/50 px-4 py-4
        sm:flex-row sm:items-center sm:justify-between
      "
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200">
          {holding.categoryName}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {holding.size ?? "One size"}
          {!isBulk && ` · Serial: ${holding.serialNumber}`}
        </p>
      </div>

      {isBulk ? (
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Held: {holding.quantity}
          </span>

          <label
            htmlFor={`return-${holding.inventoryItemId}`}
            className="sr-only"
          >
            Return quantity
          </label>

          <input
            id={`return-${holding.inventoryItemId}`}
            type="number"
            min={0}
            max={holding.quantity}
            step={1}
            value={quantity || ""}
            onChange={(event) => {
              const next = Number(event.target.value);

              if (!Number.isFinite(next) || !Number.isInteger(next)) {
                return;
              }

              onQuantityChange(Math.min(holding.quantity, Math.max(0, next)));
            }}
            className="
              w-20 rounded-lg border border-slate-700
              bg-slate-900 px-3 py-2 text-right text-sm
              text-slate-100 outline-none
              focus:border-amber-500 focus:ring-1 focus:ring-amber-500
            "
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-3 sm:flex-nowrap">
          {/* Custom Select Toggle Button / Checkbox */}
          <label
            className={`
      inline-flex cursor-pointer select-none items-center gap-2 rounded-lg border px-3 py-1.5
      text-xs font-medium transition-all duration-150
      ${
        isSelected
          ? "border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-sm shadow-amber-500/10"
          : "border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-300"
      }
    `}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelectedChange()}
              className="sr-only"
            />
            <span
              className={`
        flex h-4 w-4 items-center justify-center rounded border transition-colors
        ${
          isSelected
            ? "border-amber-500 bg-amber-500 text-slate-950"
            : "border-slate-600 bg-slate-800"
        }
      `}
            >
              {isSelected && (
                <svg
                  className="h-3 w-3 stroke-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </span>
            <span>{isSelected ? "Selected" : "Select item"}</span>
          </label>

          {/* Condition Selector */}
          <div className="flex items-center gap-2">
            <label
              htmlFor={`condition-${holding.serialNumber}`}
              className={`text-xs font-medium transition-colors ${
                isSelected ? "text-slate-300" : "text-slate-500"
              }`}
            >
              Condition
            </label>

            <div className="relative">
              <select
                id={`condition-${holding.serialNumber}`}
                value={condition}
                disabled={!isSelected}
                onChange={(event) =>
                  onConditionChange(event.target.value as ReturnCondition)
                }
                className={`
          appearance-none rounded-lg border px-3 py-1.5 pr-8 text-xs font-medium
          outline-none transition-all duration-150
          ${
            !isSelected
              ? "cursor-not-allowed border-slate-800/80 bg-slate-950/40 text-slate-600 opacity-60"
              : condition === "DAMAGED"
                ? "border-rose-500/40 bg-rose-500/10 text-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                : condition === "LOST"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  : "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          }
        `}
              >
                <option
                  value="SERVICEABLE"
                  className="bg-slate-900 text-slate-200"
                >
                  Serviceable
                </option>
                <option value="DAMAGED" className="bg-slate-900 text-rose-300">
                  Damaged
                </option>
                <option value="LOST" className="bg-slate-900 text-amber-300">
                  Lost
                </option>
              </select>

              {/* Custom Chevron Indicator */}
              <span
                aria-hidden="true"
                className={`
          pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors
          ${isSelected ? "text-slate-400" : "text-slate-600"}
        `}
              >
                ▼
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnGearRow;
