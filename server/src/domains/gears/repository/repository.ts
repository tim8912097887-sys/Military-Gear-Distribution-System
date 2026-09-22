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
import type {
  HeldBulkRow,
  HeldSerializedRow,
  HistoryRow,
  IssuedBulkResult,
  IssuedSerializedResult,
  IssueGearResult,
  ResolvedIssueBulk,
  ResolvedIssueSerialized,
  ResolvedReturnBulk,
  ResolvedReturnSerialized,
  ReturnedBulkResult,
  ReturnedSerializedResult,
  ReturnGearResult,
  ValidatedIssueRequest,
  ValidatedReturnRequest,
} from './dto.js';
import { InventoryItemNotFoundError } from '../errors/inventory-item-not-found.js';
import { SerializedItemNotFoundError } from '../errors/serialized-item-not-found.js';
import { CategoryNotFoundError } from '../errors/category-not-found.js';
import { AllowanceExceededError } from '../errors/allowance-exceeded.js';
import { InsufficientStockError } from '../errors/insufficient-stock.js';
import { CustodyCreationError } from '../errors/custody-creation.js';
import { InsufficientHoldingError } from '../errors/insufficient-holding.js';
import { CONDITION_TO_STATUS, type IssueGearInput, type ReturnGearInput } from '../service/dto.js';
import { mergeBulkLines } from '../utils/gear-lines.js';

type DatabaseExecutor =
  NodePgDatabase | NodePgTransaction<Record<string, never>, Record<string, never>>;

export class GearRepository {
  constructor(private readonly db: DatabaseExecutor) {}

  async issueGear(reservistId: string, body: IssueGearInput): Promise<IssueGearResult | undefined> {
    return this.db.transaction(async (tx) => {
      const repository = new GearRepository(tx);

      const reservist = await repository.lockReservist(reservistId);

      if (!reservist) return undefined;

      // Resolve and validate the entire request.
      const validated = await repository.validateIssueRequest(body);

      // Check category allowances.
      await repository.validateIssueAllowances(reservistId, validated);

      // Perform mutations using the already-resolved entities.
      const issued: IssueGearResult['issued'] = {
        bulk: [],
        serialized: [],
      };

      for (const resolved of validated.bulkLines) {
        issued.bulk.push(await repository.issueBulk(reservistId, resolved));
      }

      for (const resolved of validated.serializedLines) {
        issued.serialized.push(await repository.issueSerialized(reservistId, resolved));
      }

      return {
        reservistId,
        issued,
      };
    });
  }

  async returnGear(
    reservistId: string,
    body: ReturnGearInput,
  ): Promise<ReturnGearResult | undefined> {
    return this.db.transaction(async (tx) => {
      const repository = new GearRepository(tx);

      const reservist = await repository.lockReservist(reservistId);

      if (!reservist) return undefined;

      // Resolve and validate the complete return request.
      const validated = await repository.validateReturnRequest(reservistId, body);

      //  Mutate inventory using already-resolved entities.
      const returned: ReturnGearResult['returned'] = {
        bulk: [],
        serialized: [],
      };

      for (const resolved of validated.bulkLines) {
        returned.bulk.push(await repository.returnBulk(reservistId, resolved));
      }

      for (const resolved of validated.serializedLines) {
        returned.serialized.push(await repository.returnSerialized(reservistId, resolved));
      }

      return {
        reservistId,
        returned,
      };
    });
  }

  // Issued gear utils
  private async validateIssueRequest(body: IssueGearInput): Promise<ValidatedIssueRequest> {
    const bulkLines = mergeBulkLines(body.bulk);

    const serializedLines = [...body.serialized].sort((a, b) =>
      a.serialNumber.localeCompare(b.serialNumber),
    );

    const resolvedBulk: ResolvedIssueBulk[] = [];

    for (const line of bulkLines) {
      const inventoryItem = await this.findInventoryItemById(line.inventoryItemId);

      if (!inventoryItem) {
        throw new InventoryItemNotFoundError(line.inventoryItemId);
      }

      const category = await this.findCategoryById(inventoryItem.categoryId);

      if (!category) {
        throw new CategoryNotFoundError(inventoryItem.categoryId);
      }

      resolvedBulk.push({
        line,
        inventoryItem,
        category,
      });
    }

    const resolvedSerialized: ResolvedIssueSerialized[] = [];

    for (const line of serializedLines) {
      /*
       * Important:
       *
       * We lock the serialized item HERE rather than doing a normal lookup
       * followed by another lookup during mutation.
       *
       * This both resolves the item and protects the AVAILABLE check.
       */
      const serializedItem = await this.lockAvailableSerializedItem(line.serialNumber);

      if (!serializedItem) {
        throw new SerializedItemNotFoundError(line.serialNumber);
      }

      const category = await this.findCategoryById(serializedItem.categoryId);

      if (!category) {
        throw new CategoryNotFoundError(serializedItem.categoryId);
      }

      resolvedSerialized.push({
        line,
        serializedItem,
        category,
      });
    }

    return {
      bulkLines: resolvedBulk,
      serializedLines: resolvedSerialized,
    };
  }

  private async validateIssueAllowances(
    reservistId: string,
    request: ValidatedIssueRequest,
  ): Promise<void> {
    const requestedByCategory = new Map<string, number>();
    const categories = new Map<string, GearCategory>();

    for (const { line, category } of request.bulkLines) {
      categories.set(category.id, category);

      requestedByCategory.set(
        category.id,
        (requestedByCategory.get(category.id) ?? 0) + line.quantity,
      );
    }

    for (const { category } of request.serializedLines) {
      categories.set(category.id, category);

      requestedByCategory.set(category.id, (requestedByCategory.get(category.id) ?? 0) + 1);
    }

    const [heldBulk, heldSerialized] = await Promise.all([
      this.sumBulkHeldByCategory(reservistId),
      this.countSerializedHeldByCategory(reservistId),
    ]);

    for (const [categoryId, requested] of requestedByCategory) {
      const category = categories.get(categoryId);

      if (!category) {
        throw new CategoryNotFoundError(categoryId);
      }

      const held = (heldBulk.get(categoryId) ?? 0) + (heldSerialized.get(categoryId) ?? 0);

      if (held + requested > category.maxPerReservist) {
        throw new AllowanceExceededError(category.name, category.maxPerReservist);
      }
    }
  }

  private async issueBulk(
    reservistId: string,
    resolved: ResolvedIssueBulk,
  ): Promise<IssuedBulkResult> {
    const { line, inventoryItem, category } = resolved;

    const stock = await this.decreaseStock(inventoryItem.id, line.quantity);

    if (stock === undefined) {
      throw new InsufficientStockError(inventoryItem.id);
    }

    const totalHeld = await this.addBulkHolding(reservistId, inventoryItem.id, line.quantity);

    await this.writeBulkLog(reservistId, inventoryItem.id, line.quantity);

    return {
      inventoryItemId: inventoryItem.id,
      categoryId: category.id,
      categoryName: category.name,
      size: inventoryItem.size,
      quantity: line.quantity,
      remainingStock: stock,
      totalHeld,
    };
  }

  private async issueSerialized(
    reservistId: string,
    resolved: ResolvedIssueSerialized,
  ): Promise<IssuedSerializedResult> {
    const { line, serializedItem, category } = resolved;

    await this.markSerializedIssued(serializedItem.id);

    const [custody] = await this.db
      .insert(reservistSerializedGear)
      .values({
        reservistId,
        serializedItemId: serializedItem.id,
      })
      .returning({
        id: reservistSerializedGear.id,
      });

    if (!custody) {
      throw new CustodyCreationError(line.serialNumber);
    }

    await this.writeSerializedLog(reservistId, serializedItem.id);

    return {
      custodyId: custody.id,
      serializedItemId: serializedItem.id,
      serialNumber: serializedItem.serialNumber,
      categoryId: category.id,
      categoryName: category.name,
      size: serializedItem.size,
    };
  }

  // Return gear utils
  private async validateReturnRequest(
    reservistId: string,
    body: ReturnGearInput,
  ): Promise<ValidatedReturnRequest> {
    const bulkLines = mergeBulkLines(body.bulk);

    const serializedLines = [...body.serialized].sort((a, b) =>
      a.serialNumber.localeCompare(b.serialNumber),
    );

    const resolvedBulk: ResolvedReturnBulk[] = [];

    for (const line of bulkLines) {
      const inventoryItem = await this.findInventoryItemById(line.inventoryItemId);

      if (!inventoryItem) {
        throw new InventoryItemNotFoundError(line.inventoryItemId);
      }

      const holding = await this.findBulkHolding(reservistId, line.inventoryItemId);

      if (!holding || holding.quantity < line.quantity) {
        throw new InsufficientHoldingError(line.inventoryItemId);
      }

      const category = await this.findCategoryById(inventoryItem.categoryId);

      if (!category) {
        throw new CategoryNotFoundError(inventoryItem.categoryId);
      }

      resolvedBulk.push({
        line,
        inventoryItem,
        holding,
        category,
      });
    }

    const resolvedSerialized: ResolvedReturnSerialized[] = [];

    for (const line of serializedLines) {
      const holding = await this.findActiveSerializedHolding(reservistId, line.serialNumber);

      if (!holding) {
        throw new SerializedItemNotFoundError(line.serialNumber);
      }

      const category = await this.findCategoryById(holding.serializedItem.categoryId);

      if (!category) {
        throw new CategoryNotFoundError(holding.serializedItem.categoryId);
      }

      resolvedSerialized.push({
        line,
        custodyId: holding.custodyId,
        serializedItem: holding.serializedItem,
        category,
      });
    }

    return {
      bulkLines: resolvedBulk,
      serializedLines: resolvedSerialized,
    };
  }

  private async returnBulk(
    reservistId: string,
    resolved: ResolvedReturnBulk,
  ): Promise<ReturnedBulkResult> {
    const { line, inventoryItem, holding, category } = resolved;

    // Lock inventory before changing stock.
    await this.lockInventoryItem(inventoryItem.id);

    const restockedTo = await this.adjustStock(inventoryItem.id, line.quantity);

    const remainingHeld = await this.removeBulkHolding(holding.id, holding.quantity, line.quantity);

    await this.writeBulkReturnLog(reservistId, inventoryItem.id, line.quantity);

    return {
      inventoryItemId: inventoryItem.id,
      categoryId: category.id,
      categoryName: category.name,
      size: inventoryItem.size,
      quantity: line.quantity,
      remainingHeld,
      restockedTo,
    };
  }

  private async returnSerialized(
    reservistId: string,
    resolved: ResolvedReturnSerialized,
  ): Promise<ReturnedSerializedResult> {
    const { line, custodyId, serializedItem, category } = resolved;

    await this.lockSerializedItem(serializedItem.id);

    await this.updateSerializedStatus(serializedItem.id, line.condition);

    await this.markSerializedReturned(custodyId, reservistId);

    await this.writeSerializedReturnLog(reservistId, serializedItem.id);

    return {
      serializedItemId: serializedItem.id,
      serialNumber: serializedItem.serialNumber,
      categoryId: category.id,
      categoryName: category.name,
      size: serializedItem.size,
      condition: line.condition,
      newStatus: CONDITION_TO_STATUS[line.condition],
    };
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
    condition: ReturnGearInput['serialized'][number]['condition'],
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
