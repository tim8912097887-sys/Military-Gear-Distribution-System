import { useState } from "react";
import type { GearStatusResponse, IssueGearInput } from "../../../types";
import IssueGearRow from "./IssueGearRow";

type IssueGearPanelProps = {
  availability: GearStatusResponse["availability"];
  isSubmitting: boolean;
  isCheckedIn: boolean;
  onSubmit: (input: IssueGearInput) => Promise<GearStatusResponse>;
};

const IssueGearPanel = ({
  availability,
  isSubmitting,
  isCheckedIn,
  onSubmit,
}: IssueGearPanelProps) => {
  const [bulkQuantities, setBulkQuantities] = useState<Record<string, number>>(
    {},
  );

  const [selectedSerialized, setSelectedSerialized] = useState<Set<string>>(
    new Set(),
  );

  const handleBulkQuantityChange = (
    inventoryItemId: string,
    categoryId: string,
    quantity: number,
  ) => {
    setBulkQuantities((current) => {
      if (quantity <= 0) {
        const next = { ...current };
        delete next[inventoryItemId];
        return next;
      }

      const category = availability.find((c) => c.categoryId === categoryId);
      if (!category || category.trackingType !== "BULK") {
        return current;
      }

      const addedItem = {
        ...current,
        [inventoryItemId]: quantity,
      };

      // Sum up quantity for the same category
      const totalQuantity = category.sizes.reduce((acc, size) => {
        if (addedItem[size.inventoryItemId]) {
          return acc + addedItem[size.inventoryItemId];
        }

        return acc;
      }, 0);

      if (totalQuantity > category.remainingAllowance) {
        return current;
      }

      return {
        ...current,
        [inventoryItemId]: quantity,
      };
    });
  };

  const handleSerializedToggle = (serialNumber: string, categoryId: string) => {
    setSelectedSerialized((current) => {
      const next = new Set(current);

      if (next.has(serialNumber)) {
        next.delete(serialNumber);
      } else {
        const category = availability.find((c) => c.categoryId === categoryId);
        if (!category || category.trackingType !== "SERIALIZED") {
          return next;
        }
        // Check if category is already selected
        const isSelected = category.sizes.find(
          (size) =>
            next.has(size.serialNumber) && size.serialNumber !== serialNumber,
        );
        if (isSelected) {
          next.delete(isSelected.serialNumber);
        }
        next.add(serialNumber);
      }

      return next;
    });
  };

  const bulk = Object.entries(bulkQuantities).map(
    ([inventoryItemId, quantity]) => ({
      inventoryItemId,
      quantity,
    }),
  );

  const serialized = Array.from(selectedSerialized).map((serialNumber) => ({
    serialNumber,
  }));

  const hasSelection = bulk.length > 0 || serialized.length > 0;

  const handleSubmit = async () => {
    if (!hasSelection || isSubmitting) {
      return;
    }

    try {
      await onSubmit({
        bulk,
        serialized,
      });

      // Reset state after submission success
      setBulkQuantities({});
      setSelectedSerialized(new Set());
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/20">
      <div className="border-b border-slate-800 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-100">Issue gear</h2>

        <p className="mt-1 text-sm text-slate-400">
          Select available gear to issue to this reservist.
        </p>
      </div>

      <div className="divide-y divide-slate-800">
        {availability.map((item) => (
          <IssueGearRow
            key={item.categoryId}
            item={item}
            selectedBulk={bulkQuantities}
            selectedSerialized={selectedSerialized}
            onBulkQuantityChange={handleBulkQuantityChange}
            onSerializedToggle={handleSerializedToggle}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-800 px-5 py-4">
        <p className="text-sm text-slate-500">
          {hasSelection ? "Gear selected" : "No gear selected"}
        </p>

        <button
          type="button"
          disabled={!hasSelection || isSubmitting || !isCheckedIn}
          onClick={handleSubmit}
          className="
            rounded-lg bg-amber-500 px-4 py-2
            text-sm font-medium text-slate-950
            transition hover:bg-amber-400
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {isSubmitting ? "Issuing..." : "Issue selected"}
        </button>
      </div>
    </section>
  );
};

export default IssueGearPanel;
