import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { NodePgDatabase, NodePgTransaction } from 'drizzle-orm/node-postgres';
import { gearCategories } from '../../../infrastructure/db/schema/gear-categories.js';
import { inventoryItems } from '../../../infrastructure/db/schema/inventory-items.js';
import type { InventoryAdjustment, InventoryItemView } from '../service/dto.js';
import {
  inventoryLogs,
  type NewInventoryLog,
} from '../../../infrastructure/db/schema/inventory-logs.js';
import { InventoryItemNotFoundError } from '../../gears/errors/inventory-item-not-found.js';
import { InsufficientStockError } from '../../gears/errors/insufficient-stock.js';

type DatabaseExecutor =
  NodePgDatabase | NodePgTransaction<Record<string, never>, Record<string, never>>;

export class InventoryRepository {
  constructor(private readonly db: DatabaseExecutor) {}

  async listBulkItems(): Promise<InventoryItemView[]> {
    return this.db
      .select({
        name: gearCategories.name,
        size: inventoryItems.size,
        inventoryId: inventoryItems.id,
        stockQuantity: inventoryItems.stockQuantity,
      })
      .from(inventoryItems)
      .innerJoin(gearCategories, eq(gearCategories.id, inventoryItems.categoryId))
      .where(eq(gearCategories.trackingType, 'BULK'))
      .orderBy(asc(gearCategories.name), asc(inventoryItems.size));
  }

  // Fetch items with row-level locks for concurrent safety
  async getBulkItemsForUpdate(
    tx: DatabaseExecutor,
    inventoryIds: string[],
  ): Promise<InventoryItemView[]> {
    return tx
      .select({
        name: gearCategories.name,
        size: inventoryItems.size,
        inventoryId: inventoryItems.id,
        stockQuantity: inventoryItems.stockQuantity,
      })
      .from(inventoryItems)
      .innerJoin(gearCategories, eq(gearCategories.id, inventoryItems.categoryId))
      .where(and(eq(gearCategories.trackingType, 'BULK'), inArray(inventoryItems.id, inventoryIds)))
      .orderBy(asc(gearCategories.name), asc(inventoryItems.size))
      .for('update'); // Locks the selected rows until transaction commits
  }

  async adjustStockAndLog(adjustments: InventoryAdjustment[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      const inventoryIds = adjustments.map((a) => a.inventoryItemId);

      // Lock and fetch existing items within the transaction
      const existingBulk = await this.getBulkItemsForUpdate(tx, inventoryIds);

      // Validate stock levels
      for (const adjustment of adjustments) {
        const item = existingBulk.find((i) => i.inventoryId === adjustment.inventoryItemId);
        if (!item) {
          throw new InventoryItemNotFoundError(adjustment.inventoryItemId);
        }
        if (adjustment.type === 'DECREASE' && item.stockQuantity < adjustment.quantity) {
          throw new InsufficientStockError(adjustment.inventoryItemId);
        }
      }

      // Perform individual updates safely in a loop (or build a safe parameterized SQL CASE statement)
      // Executing individual updates inside a transaction is safe, clean, and avoids raw string SQL injection bugs.
      for (const adjustment of adjustments) {
        const delta = adjustment.type === 'INCREASE' ? adjustment.quantity : -adjustment.quantity;

        await tx
          .update(inventoryItems)
          .set({
            stockQuantity: sql`stock_quantity + ${delta}`,
          })
          .where(eq(inventoryItems.id, adjustment.inventoryItemId));
      }

      // Batch insert audit logs
      const logEntries: NewInventoryLog[] = adjustments.map((adjustment) => ({
        inventoryItemId: adjustment.inventoryItemId,
        actionType: adjustment.type,
        quantity: adjustment.quantity,
        performBy: adjustment.performBy,
        reason: adjustment.reason,
        note: adjustment.note,
      }));

      await tx.insert(inventoryLogs).values(logEntries);
    });
  }
}
