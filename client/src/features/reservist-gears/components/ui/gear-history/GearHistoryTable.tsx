import type { GearHistoryView } from "../../../types";
import { formatHistoryDate } from "../../../utils/format-history-date";
import HistoryAction from "./HistoryAction";

type Props = {
  history: GearHistoryView[];
};

export const GearHistoryTable = ({ history }: Props) => {
  return (
    <table className="w-full text-left">
      <thead className="border-b border-slate-800 bg-slate-950/40">
        <tr>
          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
            Action
          </th>
          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
            Gear
          </th>
          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
            Size
          </th>
          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
            Quantity
          </th>
          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
            Serial Number
          </th>
          <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
            Time
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-800">
        {history.map((item) => (
          <tr key={item.id} className="transition hover:bg-slate-800/30">
            <td className="px-6 py-4">
              <HistoryAction action={item.actionType} />
            </td>

            <td className="px-6 py-4 text-sm font-medium text-slate-200">
              {item.categoryName ?? "Unknown gear"}
            </td>

            <td className="px-6 py-4 text-sm text-slate-400">
              {item.size ?? "—"}
            </td>

            <td className="px-6 py-4 text-sm text-slate-400">
              {item.quantity ?? "—"}
            </td>

            <td className="px-6 py-4 font-mono text-sm text-slate-400">
              {item.serialNumber ?? "—"}
            </td>

            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-500">
              {formatHistoryDate(item.createdAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default GearHistoryTable;
