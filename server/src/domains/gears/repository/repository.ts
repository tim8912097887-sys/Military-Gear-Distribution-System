import { and, asc, desc, eq, gte, isNull, sql } from 'drizzle-orm';
import type { NodePgDatabase, NodePgTransaction } from 'drizzle-orm/node-postgres';
import { alias } from 'drizzle-orm/pg-core';
import {
  gearCategories,
  type GearCategory,
} from '../../../infrastructure/db/schema/gear-categories.js';
import {
  inventoryItems,
  type InventoryItem,
} from '../../../infrastructure/db/schema/inventory-items.js';
import {
  serializedItems,
  type SerializedItem,
} from '../../../infrastructure/db/schema/serialized-items.js';
import { reservistBulkGear } from '../../../infrastructure/db/schema/reservist-bulk-gear.js';
import { reservistSerializedGear } from '../../../infrastructure/db/schema/reservist-serialized-gear.js';
import { distributionLogs } from '../../../infrastructure/db/schema/distribution-logs.js';
import { reservists } from '../../../infrastructure/db/schema/reservists.js';
import type { HeldBulkRow, HeldSerializedRow, HistoryRow } from './dto.js';
import type {
  IssueGearBody,
  IssueGearResult,
  ReturnGearBody,
  ReturnGearResult,
} from '../service/dto.js';
import { InventoryItemNotFoundError } from '../errors/inventory-item-not-found.js';
import { SerializedItemNotFoundError } from '../errors/serialized-item-not-found.js';
import { CategoryNotFoundError } from '../errors/category-not-found.js';
import { AllowanceExceededError } from '../errors/allowance-exceeded.js';
import { InsufficientStockError } from '../errors/insufficient-stock.js';
import { CustodyCreationError } from '../errors/custody-creation.js';
import { InsufficientHoldingError } from '../errors/insufficient-holding.js';

type DatabaseExecutor =
  NodePgDatabase | NodePgTransaction<Record<string, never>, Record<string, never>>;

export class GearRepository {
  constructor(private readonly db: DatabaseExecutor) {}

  async issueGear(reservistId: string, body: IssueGearBody): Promise<IssueGearResult | undefined> {
    return this.db.transaction(async (tx) => {
      // Start transaction and lock the reservist
      // Every gear issue operation for the same reservist must be serialized.
      // The reservist row acts as the concurrency lock for allowance checking.
      // Without this lock, two concurrent requests could both read the same
      // current holding and both conclude that the reservist still has space under the category allowance.
      const repository = new GearRepository(tx);
      const reservist = await repository.lockReservist(reservistId);

      // Returning undefined allows the service layer to translate this into
      // the appropriate "reservist not found" response.
      if (!reservist) return undefined;

      // Normalize request ordering
      // Sorting does not change the business meaning of the request.
      // It gives bulk and serialized operations a deterministic order, which
      // is useful for predictable execution and reduces the chance of
      // inconsistent lock ordering when multiple requests are processed concurrently.
      const bulkLines = [...body.bulk].sort((a, b) =>
        a.inventoryItemId.localeCompare(b.inventoryItemId),
      );
      const serializedLines = [...body.serialized].sort((a, b) =>
        a.serialNumber.localeCompare(b.serialNumber),
      );

      // Resolve requested items and calculate requested quantity by category
      // The allowance is defined at the CATEGORY level, not at the individual
      // inventory-item level.
      // Example:
      // Camouflage Uniform shirt:
      // Bulk item A = 1 (size s)
      // Bulk item B = 1 (size m)
      // Requested Camouflage Uniform shirt total = 2
      // Therefore we first resolve every requested item and aggregate the
      // requested quantity by category.
      const requestedByCategory = new Map<string, number>();

      // Resolve bulk items.
      for (const line of bulkLines) {
        const inventoryItem = await repository.findInventoryItemById(line.inventoryItemId);
        if (!inventoryItem) {
          throw new InventoryItemNotFoundError(line.inventoryItemId);
        }
        requestedByCategory.set(
          inventoryItem.categoryId,
          (requestedByCategory.get(inventoryItem.categoryId) ?? 0) + line.quantity,
        );
      }

      // Resolve serialized items.
      // A serialized item represents exactly one physical piece of equipment,
      // so every serialized line contributes 1 to the requested category quantity.
      for (const line of serializedLines) {
        const serializedItem = await repository.findSerializedItemBySerial(line.serialNumber);
        if (!serializedItem) {
          throw new SerializedItemNotFoundError(line.serialNumber);
        }
        requestedByCategory.set(
          serializedItem.categoryId,
          (requestedByCategory.get(serializedItem.categoryId) ?? 0) + 1,
        );
      }

      // Read current holdings and validate category allowance
      // The reservist row is already locked, so these two queries are safe for
      // allowance validation against concurrent issue/return operations for
      // this reservist.
      // We calculate bulk and serialized holdings separately because they are stored in different tables.
      const [heldBulk, heldSerialized] = await Promise.all([
        repository.sumBulkHeldByCategory(reservistId),
        repository.countSerializedHeldByCategory(reservistId),
      ]);

      // Check every affected category:
      // currently held + requested quantity <= category allowance
      // This is intentionally performed BEFORE changing any inventory.
      for (const [categoryId, requested] of requestedByCategory) {
        const category = await repository.findCategoryById(categoryId);
        if (!category) throw new CategoryNotFoundError(categoryId);

        const held = (heldBulk.get(categoryId) ?? 0) + (heldSerialized.get(categoryId) ?? 0);
        if (held + requested > category.maxPerReservist) {
          throw new AllowanceExceededError(category.name, category.maxPerReservist);
        }
      }

      // Prepare response
      // Nothing has been mutated yet. From this point onward we perform the
      // actual inventory/custody changes.
      const issued: IssueGearResult['issued'] = { bulk: [], serialized: [] };

      // Issue bulk inventory
      for (const line of bulkLines) {
        const inventoryItem = await repository.findInventoryItemById(line.inventoryItemId);
        if (!inventoryItem) {
          throw new InventoryItemNotFoundError(line.inventoryItemId);
        }

        const category = await repository.findCategoryById(inventoryItem.categoryId);
        if (!category) {
          throw new CategoryNotFoundError(inventoryItem.categoryId);
        }

        // Atomically decrease stock.
        // decreaseStock() uses: WHERE stock_quantity >= requested_quantity
        // so two concurrent issue requests cannot both successfully consume inventory that does not exist.
        // If no row is returned, there was insufficient stock.
        const stock = await repository.decreaseStock(line.inventoryItemId, line.quantity);
        if (stock === undefined) {
          throw new InsufficientStockError(line.inventoryItemId);
        }

        // Add the issued quantity to the reservist's bulk holding.
        // If a holding for this reservist + inventory item already exists,
        // addBulkHolding() increments it. Otherwise it creates a new holding.
        const holding = await repository.addBulkHolding(
          reservistId,
          line.inventoryItemId,
          line.quantity,
        );

        // Write an immutable audit record describing the issue operation.
        await repository.writeBulkLog(reservistId, line.inventoryItemId, line.quantity);

        issued.bulk.push({
          inventoryItemId: line.inventoryItemId,
          categoryId: category.id,
          categoryName: category.name,
          size: inventoryItem.size,
          quantity: line.quantity,
          remainingStock: stock,
          totalHeld: holding,
        });
      }

      // Issue serialized inventory
      for (const line of serializedLines) {
        // Lock the physical serialized item and verify that it is still AVAILABLE.
        // This protects against two concurrent requests attempting to issue the same physical item.
        const serializedItem = await repository.lockAvailableSerializedItem(line.serialNumber);
        if (!serializedItem) {
          throw new SerializedItemNotFoundError(line.serialNumber);
        }

        const category = await repository.findCategoryById(serializedItem.categoryId);
        if (!category) {
          throw new CategoryNotFoundError(serializedItem.categoryId);
        }

        await repository.markSerializedIssued(serializedItem.id);

        // Create the custody record connecting the physical serialized item to this reservist.
        // This record represents the current chain of custody and allows us to later identify exactly which reservist has the item.
        const [custody] = await repository.db
          .insert(reservistSerializedGear)
          .values({ reservistId, serializedItemId: serializedItem.id })
          .returning({ id: reservistSerializedGear.id });
        if (!custody) throw new CustodyCreationError(line.serialNumber);

        // Write the serialized issue operation to the audit log.
        await repository.writeSerializedLog(reservistId, serializedItem.id);
        issued.serialized.push({
          custodyId: custody.id,
          serializedItemId: serializedItem.id,
          serialNumber: serializedItem.serialNumber,
          categoryId: category.id,
          categoryName: category.name,
          size: serializedItem.size,
        });
      }

      return { reservistId, requestId: null, issued };
    });
  }

  async returnGear(
    reservistId: string,
    body: ReturnGearBody,
  ): Promise<ReturnGearResult | undefined> {
    return this.db.transaction(async (tx) => {
      // Start transaction and lock the reservist
      // The reservist lock serializes concurrent issue/return operations for this reservist.
      // This is important because allowance calculations and current holdings must not be evaluated against a changing reservist state.
      const repository = new GearRepository(tx);
      const reservist = await repository.lockReservist(reservistId);
      if (!reservist) return undefined;

      // Normalize and aggregate request lines
      // A client may accidentally send the same bulk inventory item more than once:
      // [{ itemA, quantity: 2 }, { itemA, quantity: 3 }]
      // We merge these into: [{ itemA, quantity: 5 }]
      // This makes the rest of the transaction operate on one deterministic line per inventory item.
      const bulkLines = [
        ...body.bulk.reduce((lines, line) => {
          const existing = lines.get(line.inventoryItemId);
          lines.set(line.inventoryItemId, {
            inventoryItemId: line.inventoryItemId,
            quantity: (existing?.quantity ?? 0) + line.quantity,
          });
          return lines;
        }, new Map<string, ReturnGearBody['bulk'][number]>()),
      ]
        // Use deterministic ordering for consistent processing/locking.
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([, line]) => line);

      // Serialized items are already unique physical items, so we only need deterministic ordering here.
      const serializedLines = [...body.serialized].sort((a, b) =>
        a.serialNumber.localeCompare(b.serialNumber),
      );

      // Validate all bulk return requests
      // We resolve and validate everything BEFORE modifying inventory.
      // This prevents a transaction from partially processing a request before discovering that another requested item is not actually held.
      const bulkHoldings = new Map<
        string,
        {
          inventoryItem: InventoryItem;
          holding: { id: string; quantity: number };
          category: GearCategory;
        }
      >();

      for (const line of bulkLines) {
        // Confirm that the requested inventory item exists.
        const inventoryItem = await repository.findInventoryItemById(line.inventoryItemId);
        if (!inventoryItem) throw new InventoryItemNotFoundError(line.inventoryItemId);

        // Confirm that this reservist currently holds enough of this item.
        // Example: Current holding = 5
        // Return request = 3 Valid
        // Current holding = 2
        // Return request = 3 Invalid
        const holding = await repository.findBulkHolding(reservistId, line.inventoryItemId);
        if (!holding || holding.quantity < line.quantity) {
          throw new InsufficientHoldingError(line.inventoryItemId);
        }

        const category = await repository.findCategoryById(inventoryItem.categoryId);
        if (!category) throw new CategoryNotFoundError(inventoryItem.categoryId);
        bulkHoldings.set(line.inventoryItemId, { inventoryItem, holding, category });
      }

      // A serialized return must correspond to an active custody record for THIS reservist.
      // This prevents a reservist from returning an item that belongs to another reservist.
      const serializedHoldings = new Map<
        string,
        { custodyId: string; serializedItem: SerializedItem; category: GearCategory }
      >();
      for (const line of serializedLines) {
        const holding = await repository.findActiveSerializedHolding(
          reservistId,
          line.serialNumber,
        );
        if (!holding) throw new SerializedItemNotFoundError(line.serialNumber);

        const category = await repository.findCategoryById(holding.serializedItem.categoryId);
        if (!category) throw new CategoryNotFoundError(holding.serializedItem.categoryId);
        serializedHoldings.set(line.serialNumber, { ...holding, category });
      }

      const returned: ReturnGearResult['returned'] = { bulk: [], serialized: [] };

      // Return bulk inventory
      for (const line of bulkLines) {
        const resolved = bulkHoldings.get(line.inventoryItemId);
        if (!resolved) throw new InventoryItemNotFoundError(line.inventoryItemId);

        // Lock the inventory row before changing stock.
        // This makes stock adjustment deterministic when multiple transactions are returning/issuing the same inventory item concurrently.
        await repository.lockInventoryItem(line.inventoryItemId);

        // Returning bulk equipment puts the quantity back into available inventory.
        const restockedTo = await repository.adjustStock(line.inventoryItemId, line.quantity);

        // Remove the returned quantity from the reservist's holding.
        // If the entire holding is returned, the holding row is deleted.
        // Otherwise its quantity is decreased.
        const remainingHeld = await repository.removeBulkHolding(
          resolved.holding.id,
          resolved.holding.quantity,
          line.quantity,
        );
        // Write the return operation to the audit log.
        await repository.writeBulkReturnLog(reservistId, line.inventoryItemId, line.quantity);

        returned.bulk.push({
          inventoryItemId: line.inventoryItemId,
          categoryId: resolved.category.id,
          categoryName: resolved.category.name,
          size: resolved.inventoryItem.size,
          quantity: line.quantity,
          remainingHeld,
          restockedTo,
        });
      }

      // Return serialized inventory
      for (const line of serializedLines) {
        const resolved = serializedHoldings.get(line.serialNumber);
        if (!resolved) throw new SerializedItemNotFoundError(line.serialNumber);

        // Lock the physical serialized item before changing its status.
        await repository.lockSerializedItem(resolved.serializedItem.id);

        // The condition supplied during return determines the item's next inventory status:
        // SERVICEABLE -> AVAILABLE
        // DAMAGED -> MAINTENANCE
        // LOST -> LOST
        await repository.updateSerializedStatus(resolved.serializedItem.id, line.condition);

        // Close the custody relationship between the reservist and the item.
        // returnedAt being populated means this reservist no longer possesses the item.
        await repository.markSerializedReturned(resolved.custodyId, reservistId);

        // Write the serialized return operation to the audit log.
        await repository.writeSerializedReturnLog(reservistId, resolved.serializedItem.id);

        returned.serialized.push({
          serializedItemId: resolved.serializedItem.id,
          serialNumber: resolved.serializedItem.serialNumber,
          categoryId: resolved.category.id,
          categoryName: resolved.category.name,
          size: resolved.serializedItem.size,
          condition: line.condition,
          newStatus:
            line.condition === 'SERVICEABLE'
              ? 'AVAILABLE'
              : line.condition === 'DAMAGED'
                ? 'MAINTENANCE'
                : 'LOST',
        });
      }

      return { reservistId, requestId: null, returned };
    });
  }

  private async lockReservist(id: string) {
    const [row] = await this.db
      .select()
      .from(reservists)
      .where(eq(reservists.id, id))
      .limit(1)
      .for('update');
    return row;
  }

  private async decreaseStock(inventoryItemId: string, quantity: number) {
    const [row] = await this.db
      .update(inventoryItems)
      .set({ stockQuantity: sql`${inventoryItems.stockQuantity} - ${quantity}` })
      .where(
        and(eq(inventoryItems.id, inventoryItemId), gte(inventoryItems.stockQuantity, quantity)),
      )
      .returning({ stockQuantity: inventoryItems.stockQuantity });
    return row?.stockQuantity;
  }

  private async lockInventoryItem(inventoryItemId: string) {
    const [row] = await this.db
      .select({ id: inventoryItems.id })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, inventoryItemId))
      .limit(1)
      .for('update');
    return row;
  }

  private async removeBulkHolding(id: string, currentQuantity: number, quantity: number) {
    if (currentQuantity === quantity) {
      await this.db.delete(reservistBulkGear).where(eq(reservistBulkGear.id, id));
      return 0;
    }

    const [row] = await this.db
      .update(reservistBulkGear)
      .set({
        quantity: sql`${reservistBulkGear.quantity} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(reservistBulkGear.id, id))
      .returning({ quantity: reservistBulkGear.quantity });
    return row?.quantity ?? 0;
  }

  private async findActiveSerializedHolding(reservistId: string, serialNumber: string) {
    const [row] = await this.db
      .select({
        custodyId: reservistSerializedGear.id,
        serializedItem: serializedItems,
      })
      .from(reservistSerializedGear)
      .innerJoin(serializedItems, eq(serializedItems.id, reservistSerializedGear.serializedItemId))
      .where(
        and(
          eq(reservistSerializedGear.reservistId, reservistId),
          eq(serializedItems.serialNumber, serialNumber),
          isNull(reservistSerializedGear.returnedAt),
        ),
      )
      .limit(1);
    return row;
  }

  private async lockSerializedItem(serializedItemId: string) {
    const [row] = await this.db
      .select({ id: serializedItems.id })
      .from(serializedItems)
      .where(eq(serializedItems.id, serializedItemId))
      .limit(1)
      .for('update');
    return row;
  }

  private async updateSerializedStatus(
    serializedItemId: string,
    condition: ReturnGearBody['serialized'][number]['condition'],
  ) {
    const status =
      condition === 'SERVICEABLE' ? 'AVAILABLE' : condition === 'DAMAGED' ? 'MAINTENANCE' : 'LOST';
    await this.db
      .update(serializedItems)
      .set({ status })
      .where(eq(serializedItems.id, serializedItemId));
  }

  private async markSerializedReturned(custodyId: string, reservistId: string) {
    await this.db
      .update(reservistSerializedGear)
      .set({ returnedAt: new Date() })
      .where(
        and(
          eq(reservistSerializedGear.id, custodyId),
          eq(reservistSerializedGear.reservistId, reservistId),
          isNull(reservistSerializedGear.returnedAt),
        ),
      );
  }

  private async addBulkHolding(reservistId: string, inventoryItemId: string, quantity: number) {
    const [row] = await this.db
      .insert(reservistBulkGear)
      .values({ reservistId, inventoryItemId, quantity })
      .onConflictDoUpdate({
        target: [reservistBulkGear.reservistId, reservistBulkGear.inventoryItemId],
        set: {
          quantity: sql`${reservistBulkGear.quantity} + ${quantity}`,
          updatedAt: new Date(),
        },
      })
      .returning({ quantity: reservistBulkGear.quantity });
    return row?.quantity ?? quantity;
  }

  private async lockAvailableSerializedItem(serialNumber: string) {
    const [row] = await this.db
      .select()
      .from(serializedItems)
      .where(
        and(
          eq(serializedItems.serialNumber, serialNumber),
          eq(serializedItems.status, 'AVAILABLE'),
        ),
      )
      .limit(1)
      .for('update');
    return row;
  }

  private async markSerializedIssued(serializedItemId: string) {
    await this.db
      .update(serializedItems)
      .set({ status: 'ISSUED' })
      .where(eq(serializedItems.id, serializedItemId));
  }

  private async writeBulkLog(reservistId: string, inventoryItemId: string, quantity: number) {
    await this.db.insert(distributionLogs).values({
      reservistId,
      inventoryItemId,
      actionType: 'ISSUE',
      quantity,
    });
  }

  private async writeBulkReturnLog(reservistId: string, inventoryItemId: string, quantity: number) {
    await this.db.insert(distributionLogs).values({
      reservistId,
      inventoryItemId,
      actionType: 'RETURN',
      quantity,
    });
  }

  private async writeSerializedLog(reservistId: string, serializedItemId: string) {
    await this.db.insert(distributionLogs).values({
      reservistId,
      serializedItemId,
      actionType: 'ISSUE',
    });
  }

  private async writeSerializedReturnLog(reservistId: string, serializedItemId: string) {
    await this.db.insert(distributionLogs).values({
      reservistId,
      serializedItemId,
      actionType: 'RETURN',
    });
  }

  async findCategoryById(id: string): Promise<GearCategory | undefined> {
    const [row] = await this.db
      .select()
      .from(gearCategories)
      .where(eq(gearCategories.id, id))
      .limit(1);
    return row;
  }

  async findInventoryItemById(id: string): Promise<InventoryItem | undefined> {
    const [row] = await this.db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id))
      .limit(1);
    return row;
  }

  /** Non-locking read, used while resolving request lines. */
  async findSerializedItemBySerial(serialNumber: string): Promise<SerializedItem | undefined> {
    const [row] = await this.db
      .select()
      .from(serializedItems)
      .where(eq(serializedItems.serialNumber, serialNumber))
      .limit(1);
    return row;
  }

  // ------------------------------------------------------------------
  // Allowance accounting (safe without FOR UPDATE because the caller
  // already holds the reservist row lock)
  // ------------------------------------------------------------------

  async sumBulkHeldByCategory(reservistId: string): Promise<Map<string, number>> {
    const rows = await this.db
      .select({
        categoryId: inventoryItems.categoryId,
        total: sql<number>`coalesce(sum(${reservistBulkGear.quantity}), 0)::int`,
      })
      .from(reservistBulkGear)
      .innerJoin(inventoryItems, eq(inventoryItems.id, reservistBulkGear.inventoryItemId))
      .where(eq(reservistBulkGear.reservistId, reservistId))
      .groupBy(inventoryItems.categoryId);

    return new Map(rows.map((r) => [r.categoryId, r.total]));
  }

  async countSerializedHeldByCategory(reservistId: string): Promise<Map<string, number>> {
    const rows = await this.db
      .select({
        categoryId: serializedItems.categoryId,
        total: sql<number>`count(*)::int`,
      })
      .from(reservistSerializedGear)
      .innerJoin(serializedItems, eq(serializedItems.id, reservistSerializedGear.serializedItemId))
      .where(
        and(
          eq(reservistSerializedGear.reservistId, reservistId),
          isNull(reservistSerializedGear.returnedAt),
        ),
      )
      .groupBy(serializedItems.categoryId);

    return new Map(rows.map((r) => [r.categoryId, r.total]));
  }

  // ------------------------------------------------------------------
  // Bulk mutations
  // ------------------------------------------------------------------

  async adjustStock(inventoryItemId: string, delta: number): Promise<number> {
    const [row] = await this.db
      .update(inventoryItems)
      .set({ stockQuantity: sql`${inventoryItems.stockQuantity} + ${delta}` })
      .where(eq(inventoryItems.id, inventoryItemId))
      .returning({ stockQuantity: inventoryItems.stockQuantity });
    return row?.stockQuantity ?? 0;
  }

  async findBulkHolding(
    reservistId: string,
    inventoryItemId: string,
  ): Promise<{ id: string; quantity: number } | undefined> {
    const [row] = await this.db
      .select({ id: reservistBulkGear.id, quantity: reservistBulkGear.quantity })
      .from(reservistBulkGear)
      .where(
        and(
          eq(reservistBulkGear.reservistId, reservistId),
          eq(reservistBulkGear.inventoryItemId, inventoryItemId),
        ),
      )
      .limit(1);
    return row;
  }

  // ------------------------------------------------------------------
  // Read models
  // ------------------------------------------------------------------

  async listCategories(): Promise<GearCategory[]> {
    return this.db.select().from(gearCategories).orderBy(asc(gearCategories.name));
  }

  async listHeldBulk(reservistId: string): Promise<HeldBulkRow[]> {
    return this.db
      .select({
        inventoryItemId: reservistBulkGear.inventoryItemId,
        size: inventoryItems.size,
        quantity: reservistBulkGear.quantity,
        categoryId: gearCategories.id,
        categoryName: gearCategories.name,
        issuedAt: reservistBulkGear.issuedAt,
      })
      .from(reservistBulkGear)
      .innerJoin(inventoryItems, eq(inventoryItems.id, reservistBulkGear.inventoryItemId))
      .innerJoin(gearCategories, eq(gearCategories.id, inventoryItems.categoryId))
      .where(eq(reservistBulkGear.reservistId, reservistId))
      .orderBy(asc(gearCategories.name), asc(inventoryItems.size));
  }

  async listHeldSerialized(reservistId: string): Promise<HeldSerializedRow[]> {
    return this.db
      .select({
        custodyId: reservistSerializedGear.id,
        serializedItemId: serializedItems.id,
        serialNumber: serializedItems.serialNumber,
        size: serializedItems.size,
        categoryId: gearCategories.id,
        categoryName: gearCategories.name,
        issuedAt: reservistSerializedGear.issuedAt,
      })
      .from(reservistSerializedGear)
      .innerJoin(serializedItems, eq(serializedItems.id, reservistSerializedGear.serializedItemId))
      .innerJoin(gearCategories, eq(gearCategories.id, serializedItems.categoryId))
      .where(
        and(
          eq(reservistSerializedGear.reservistId, reservistId),
          isNull(reservistSerializedGear.returnedAt),
        ),
      )
      .orderBy(asc(gearCategories.name), asc(serializedItems.serialNumber));
  }

  async listHistory(reservistId: string, limit: number): Promise<HistoryRow[]> {
    // The log points at either a bulk SKU or a serialized item, so the
    // category has to be reached through two independent join paths.
    const bulkCategory = alias(gearCategories, 'bulk_category');
    const serializedCategory = alias(gearCategories, 'serialized_category');

    return this.db
      .select({
        id: distributionLogs.id,
        actionType: distributionLogs.actionType,
        quantity: distributionLogs.quantity,
        categoryName: sql<
          string | null
        >`coalesce(${bulkCategory.name}, ${serializedCategory.name})`,
        size: sql<string | null>`coalesce(${inventoryItems.size}, ${serializedItems.size})`,
        serialNumber: serializedItems.serialNumber,
        createdAt: distributionLogs.createdAt,
      })
      .from(distributionLogs)
      .leftJoin(inventoryItems, eq(inventoryItems.id, distributionLogs.inventoryItemId))
      .leftJoin(bulkCategory, eq(bulkCategory.id, inventoryItems.categoryId))
      .leftJoin(serializedItems, eq(serializedItems.id, distributionLogs.serializedItemId))
      .leftJoin(serializedCategory, eq(serializedCategory.id, serializedItems.categoryId))
      .where(eq(distributionLogs.reservistId, reservistId))
      .orderBy(desc(distributionLogs.createdAt))
      .limit(limit);
  }
}
