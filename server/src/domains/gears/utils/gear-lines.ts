import type { BulkLineInput } from '../service/dto.js';

export function mergeBulkLines(lines: BulkLineInput[]): BulkLineInput[] {
  const merged = new Map<string, number>();

  for (const line of lines) {
    merged.set(line.inventoryItemId, (merged.get(line.inventoryItemId) ?? 0) + line.quantity);
  }

  return [...merged.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([inventoryItemId, quantity]) => ({
      inventoryItemId,
      quantity,
    }));
}
