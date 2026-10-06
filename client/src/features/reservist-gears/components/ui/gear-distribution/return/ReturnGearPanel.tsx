import { useState } from "react";
import type {
  GearStatusResponse,
  ReturnCondition,
  ReturnGearInput,
} from "../../../../types";
import ReturnGearRow from "./ReturnGearRow";

type ReturnGearPanelProps = {
  holdings: GearStatusResponse["holdings"];
  isMutating: boolean;
  isCheckedIn: boolean;
  onSubmit: (input: ReturnGearInput) => Promise<GearStatusResponse>;
};

const ReturnGearPanel = ({
  holdings,
  isMutating,
  isCheckedIn,
  onSubmit,
}: ReturnGearPanelProps) => {
  const [bulkQuantities, setBulkQuantities] = useState<Record<string, number>>(
    {},
  );

  const [selectedSerialized, setSelectedSerialized] = useState<Set<string>>(
    new Set(),
  );
  const [conditions, setConditions] = useState<Record<string, ReturnCondition>>(
    {},
  );

  const handleBulkQuantityChange = (
    inventoryItemId: string,
    quantity: number,
  ) => {
    setBulkQuantities((current) => {
      if (quantity <= 0) {
        const next = { ...current };
        delete next[inventoryItemId];
        return next;
      }

      return {
        ...current,
        [inventoryItemId]: quantity,
      };
    });
  };

  const handleSerialSelectChange = (serialNumber: string) => {
    if (selectedSerialized.has(serialNumber)) {
      setSelectedSerialized((current) => {
        const next = new Set(current);
        next.delete(serialNumber);
        return next;
      });
      setConditions((current) => {
        const next = { ...current };
        delete next[serialNumber];
        return next;
      });
    } else {
      setSelectedSerialized((current) => new Set(current).add(serialNumber));
      setConditions((current) => ({
        ...current,
        [serialNumber]: "SERVICEABLE",
      }));
    }
  };

  const handleConditionChange = (
    serialNumber: string,
    condition: ReturnCondition,
  ) => {
    setConditions((current) => ({
      ...current,
      [serialNumber]: condition,
    }));
  };

  const bulk = Object.entries(bulkQuantities).map(
    ([inventoryItemId, quantity]) => ({
      inventoryItemId,
      quantity,
    }),
  );

  const serialized = holdings.serialized
    .filter(
      (holding) =>
        selectedSerialized.has(holding.serialNumber) &&
        conditions[holding.serialNumber] !== undefined,
    )
    .map((holding) => ({
      serialNumber: holding.serialNumber,
      condition: conditions[holding.serialNumber],
    }));

  const hasSelection = bulk.length > 0 || serialized.length > 0;

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasSelection || isMutating) {
      return;
    }
    try {
      await onSubmit({
        bulk,
        serialized,
      });
    } catch {
    } finally {
      // Reset state after submission
      setBulkQuantities({});
      setConditions({});
      setSelectedSerialized(new Set());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/20"
    >
      <div className="border-b border-slate-800 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-100">Return gear</h2>

        <p className="mt-1 text-sm text-slate-400">
          Select gear being returned by this reservist.
        </p>
      </div>

      <div className="space-y-2 px-5 py-5">
        {holdings.bulk.map((holding) => (
          <ReturnGearRow
            key={holding.inventoryItemId}
            holding={holding}
            isSelected={false}
            quantity={bulkQuantities[holding.inventoryItemId] ?? 0}
            condition="SERVICEABLE"
            onSelectedChange={() => {}}
            onQuantityChange={(quantity) =>
              handleBulkQuantityChange(holding.inventoryItemId, quantity)
            }
            onConditionChange={() => {}}
          />
        ))}

        {holdings.serialized.map((holding) => (
          <ReturnGearRow
            key={holding.custodyId}
            holding={holding}
            quantity={0}
            isSelected={selectedSerialized.has(holding.serialNumber)}
            condition={conditions[holding.serialNumber] ?? "SERVICEABLE"}
            onQuantityChange={() => {}}
            onSelectedChange={() =>
              handleSerialSelectChange(holding.serialNumber)
            }
            onConditionChange={(condition) =>
              handleConditionChange(holding.serialNumber, condition)
            }
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-800 px-5 py-4">
        <p className="text-sm text-slate-500">
          {hasSelection ? "Gear selected" : "No gear selected"}
        </p>

        <button
          type="submit"
          disabled={!hasSelection || isMutating || !isCheckedIn}
          className="
            rounded-lg bg-amber-500 px-4 py-2
            text-sm font-medium text-slate-950
            transition hover:bg-amber-400
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {isMutating ? "Returning..." : "Return selected"}
        </button>
      </div>
    </form>
  );
};

export default ReturnGearPanel;
