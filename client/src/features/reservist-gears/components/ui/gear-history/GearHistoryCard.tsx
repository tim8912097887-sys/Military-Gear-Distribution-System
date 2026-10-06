import type { GearHistoryView } from "../../../types";
import { formatHistoryDate } from "../../../utils/format-history-date";
import HistoryAction from "./HistoryAction";

type Props = {
  item: GearHistoryView;
};

export const GearHistoryCard = ({ item }: Props) => {
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-4">
        <HistoryAction action={item.actionType} />

        <time
          dateTime={item.createdAt}
          className="text-right text-xs text-slate-500"
        >
          {formatHistoryDate(item.createdAt)}
        </time>
      </div>

      <div className="mt-4">
        <p className="font-medium text-slate-200">
          {item.categoryName ?? "Unknown gear"}
        </p>

        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <HistoryField label="Size" value={item.size ?? "—"} />
          <HistoryField
            label="Quantity"
            value={item.quantity?.toString() ?? "—"}
          />

          {item.serialNumber && (
            <div className="col-span-2">
              <HistoryField
                label="Serial number"
                value={item.serialNumber}
                mono
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

const HistoryField = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-0.5 text-slate-300 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
};

export default GearHistoryCard;
