import { z } from 'zod';
import { INVENTORY_ADJUSTMENT_REASONS, INVENTORY_ADJUSTMENT_TYPES } from '../service/dto.js';

export const inventoryAdjustmentBodySchema = z.object({
  adjustments: z
    .array(
      z.object({
        inventoryItemId: z.uuid(),
        type: z.enum(INVENTORY_ADJUSTMENT_TYPES),
        quantity: z.number().int().positive(),
        reason: z.enum(INVENTORY_ADJUSTMENT_REASONS),
        note: z.string().max(500).nullable().default(null),
        performBy: z.string().trim().min(1).max(100),
      }),
    )
    .min(1)
    .superRefine((adjustments, ctx) => {
      const seenIds = new Set<string>();
      for (const [index, adjustment] of adjustments.entries()) {
        if (seenIds.has(adjustment.inventoryItemId)) {
          ctx.addIssue({
            code: 'custom',
            message: `Duplicate inventoryItemId '${adjustment.inventoryItemId}' is not allowed in the same request.`,
            path: [index, 'inventoryItemId'],
          });
        }
        seenIds.add(adjustment.inventoryItemId);
      }
    }),
});
export type InventoryAdjustmentBody = z.infer<typeof inventoryAdjustmentBodySchema>;
