import { and, asc, desc, eq, gte, isNull, notInArray, sql } from 'drizzle-orm';
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
import type { IssueGearBody, IssueGearResult } from '../service/dto.js';
import { InventoryItemNotFoundError } from '../errors/inventory-item-not-found.js';
import { SerializedItemNotFoundError } from '../errors/serialized-item-not-found.js';
import { CategoryNotFoundError } from '../errors/category-not-found.js';
import { AllowanceExceededError } from '../errors/allowance-exceeded.js';
import { InsufficientStockError } from '../errors/insufficient-stock.js';
import { CustodyCreationError } from '../errors/custody-creation.js';

type DatabaseExecutor =
  NodePgDatabase | NodePgTransaction<Record<string, never>, Record<string, never>>;

export class GearRepository {
  constructor(private readonly db: DatabaseExecutor) {}

  async issueGear(reservistId: string, body: IssueGearBody): Promise<IssueGearResult | undefined> {
    return this.db.transaction(async (tx) => {
      const repository = new GearRepository(tx);
      const reservist = await repository.lockReservist(reservistId);
      if (!reservist) return undefined;

      body.bulk.sort((a, b) => a.inventoryItemId.localeCompare(b.inventoryItemId));
      body.serialized.sort((a, b) => a.serialNumber.localeCompare(b.serialNumber));
      const requestedByCategory = new Map<string, number>();
      for (const line of body.bulk) {
        const inventoryItem = await repository.findInventoryItemById(line.inventoryItemId);
        if (!inventoryItem) {
          throw new InventoryItemNotFoundError(line.inventoryItemId);
        }
        requestedByCategory.set(
          inventoryItem.categoryId,
          (requestedByCategory.get(inventoryItem.categoryId) ?? 0) + line.quantity,
        );
      }
      for (const line of body.serialized) {
        const serializedItem = await repository.findSerializedItemBySerial(line.serialNumber);
        if (!serializedItem) {
          throw new SerializedItemNotFoundError(line.serialNumber);
        }
        requestedByCategory.set(
          serializedItem.categoryId,
          (requestedByCategory.get(serializedItem.categoryId) ?? 0) + 1,
        );
      }

      const [heldBulk, heldSerialized] = await Promise.all([
        repository.sumBulkHeldByCategory(reservistId),
        repository.countSerializedHeldByCategory(reservistId),
      ]);
      for (const [categoryId, requested] of requestedByCategory) {
        const category = await repository.findCategoryById(categoryId);
        if (!category) throw new CategoryNotFoundError(categoryId);

        const held = (heldBulk.get(categoryId) ?? 0) + (heldSerialized.get(categoryId) ?? 0);
        if (held + requested > category.maxPerReservist) {
          throw new AllowanceExceededError(category.name, category.maxPerReservist);
        }
      }

      const issued: IssueGearResult['issued'] = { bulk: [], serialized: [] };

      for (const line of body.bulk) {
        const inventoryItem = await repository.findInventoryItemById(line.inventoryItemId);
        if (!inventoryItem) {
          throw new InventoryItemNotFoundError(line.inventoryItemId);
        }

        const category = await repository.findCategoryById(inventoryItem.categoryId);
        if (!category) {
          throw new CategoryNotFoundError(inventoryItem.categoryId);
        }

        const stock = await repository.decreaseStock(line.inventoryItemId, line.quantity);
        if (stock === undefined) {
          throw new InsufficientStockError(line.inventoryItemId);
        }

        const holding = await repository.addBulkHolding(
          reservistId,
          line.inventoryItemId,
          line.quantity,
        );
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

      for (const line of body.serialized) {
        const serializedItem = await repository.lockAvailableSerializedItem(line.serialNumber);
        if (!serializedItem) {
          throw new SerializedItemNotFoundError(line.serialNumber);
        }

        const category = await repository.findCategoryById(serializedItem.categoryId);
        if (!category) {
          throw new CategoryNotFoundError(serializedItem.categoryId);
        }

        await repository.markSerializedIssued(serializedItem.id);
        const [custody] = await repository.db
          .insert(reservistSerializedGear)
          .values({ reservistId, serializedItemId: serializedItem.id })
          .returning({ id: reservistSerializedGear.id });
        if (!custody) throw new CustodyCreationError(line.serialNumber);

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

  private async writeSerializedLog(reservistId: string, serializedItemId: string) {
    await this.db.insert(distributionLogs).values({
      reservistId,
      serializedItemId,
      actionType: 'ISSUE',
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

  async findCategoryByName(name: string): Promise<GearCategory | undefined> {
    const [row] = await this.db
      .select()
      .from(gearCategories)
      .where(eq(gearCategories.name, name))
      .limit(1);
    return row;
  }

  async findCategoryIdByInventoryItemId(id: string): Promise<string | undefined> {
    const [row] = await this.db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id))
      .limit(1);
    return row?.categoryId;
  }

  async findCategoryIdBySerializedItemId(id: string): Promise<string | undefined> {
    const [row] = await this.db
      .select()
      .from(serializedItems)
      .where(eq(serializedItems.id, id))
      .limit(1);
    return row?.categoryId;
  }

  async findInventoryItemById(id: string): Promise<InventoryItem | undefined> {
    const [row] = await this.db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id))
      .limit(1);
    return row;
  }

  async findInventoryItemByCategoryAndSize(
    categoryId: string,
    size: string | null,
  ): Promise<InventoryItem | undefined> {
    const [row] = await this.db
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.categoryId, categoryId),
          size === null ? isNull(inventoryItems.size) : eq(inventoryItems.size, size),
        ),
      )
      .limit(1);
    return row;
  }

  /** Non-locking read, used while resolving request lines. */
  async findSerializedItemById(id: string): Promise<SerializedItem | undefined> {
    const [row] = await this.db
      .select()
      .from(serializedItems)
      .where(eq(serializedItems.id, id))
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

  /**
   * Claims one AVAILABLE unit of a category/size. SKIP LOCKED means two desks
   * issuing "any helmet" at the same instant each grab a different physical
   * unit instead of queueing behind one row.
   */
  async claimAvailableSerializedItem(
    categoryId: string,
    size: string | null,
    excludeIds: string[],
  ): Promise<SerializedItem | undefined> {
    const filters = [
      eq(serializedItems.categoryId, categoryId),
      eq(serializedItems.status, 'AVAILABLE'),
      size === null ? isNull(serializedItems.size) : eq(serializedItems.size, size),
    ];
    if (excludeIds.length > 0) {
      filters.push(notInArray(serializedItems.id, excludeIds));
    }

    const [row] = await this.db
      .select()
      .from(serializedItems)
      .where(and(...filters))
      .orderBy(asc(serializedItems.serialNumber))
      .limit(1)
      .for('update', { skipLocked: true });
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

  async findCategoryBulkHolding(reservistId: string, categoryId: string): Promise<number> {
    const [row] = await this.db
      .select({ quantity: sql<number>`sum(${reservistBulkGear.quantity})` })
      .from(reservistBulkGear)
      .innerJoin(inventoryItems, eq(inventoryItems.id, reservistBulkGear.inventoryItemId))
      .where(
        and(
          eq(reservistBulkGear.reservistId, reservistId),
          eq(inventoryItems.categoryId, categoryId),
        ),
      )
      .limit(1);
    return row?.quantity ?? 0;
  }

  async findCategorySerializedHolding(reservistId: string, categoryId: string): Promise<number> {
    const [row] = await this.db
      .select({ quantity: sql<number>`count(*)` })
      .from(reservistSerializedGear)
      .innerJoin(serializedItems, eq(serializedItems.id, reservistSerializedGear.serializedItemId))
      .where(
        and(
          eq(reservistSerializedGear.reservistId, reservistId),
          isNull(reservistSerializedGear.returnedAt),
          eq(serializedItems.categoryId, categoryId),
        ),
      )
      .limit(1);
    return row?.quantity ?? 0;
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
