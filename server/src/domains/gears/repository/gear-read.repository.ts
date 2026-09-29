import type { NodePgDatabase, NodePgTransaction } from 'drizzle-orm/node-postgres';
import type {
  GearAvailabilitySizeResult,
  GearHistoryResult,
  HeldBulkRow,
  HeldSerializedRow,
} from './dto.js';
import {
  gearCategories,
  type GearCategory,
} from '../../../infrastructure/db/schema/gear-categories.js';
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { reservistBulkGear } from '../../../infrastructure/db/schema/reservist-bulk-gear.js';
import { inventoryItems } from '../../../infrastructure/db/schema/inventory-items.js';
import { reservistSerializedGear } from '../../../infrastructure/db/schema/reservist-serialized-gear.js';
import { serializedItems } from '../../../infrastructure/db/schema/serialized-items.js';
import { alias } from 'drizzle-orm/pg-core';
import { distributionLogs } from '../../../infrastructure/db/schema/distribution-logs.js';

type DatabaseExecutor =
  NodePgDatabase | NodePgTransaction<Record<string, never>, Record<string, never>>;

export class GearReadRepository {
  constructor(private readonly db: DatabaseExecutor) {}

  async listAvailableStock(): Promise<GearAvailabilitySizeResult[]> {
    const bulkSizes = await this.listBulkStock();
    const serializedSizes = await this.listSerializedStock();

    return [...bulkSizes, ...serializedSizes];
  }

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

  async listHistory(
    reservistId: string,
    limit: number,
    offset: number,
  ): Promise<GearHistoryResult> {
    // The log points at either a bulk SKU or a serialized item, so the
    // category has to be reached through two independent join paths.
    const bulkCategory = alias(gearCategories, 'bulk_category');
    const serializedCategory = alias(gearCategories, 'serialized_category');

    const rows = await this.db
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
      .limit(limit + 1)
      .offset(offset);

    const total = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(distributionLogs)
      .where(eq(distributionLogs.reservistId, reservistId));

    const hasMore = rows.length > limit;

    return {
      history: rows.slice(0, limit),
      pagination: {
        total: total[0].count,
        limit,
        hasMore,
      },
    };
  }

  async listBulkStock(): Promise<GearAvailabilitySizeResult[]> {
    const rows = await this.db
      .select({
        id: inventoryItems.id,
        size: inventoryItems.size,
        stockQuantity: inventoryItems.stockQuantity,
        categoryId: inventoryItems.categoryId,
      })
      .from(gearCategories)
      .innerJoin(inventoryItems, eq(inventoryItems.categoryId, gearCategories.id))
      .orderBy(asc(inventoryItems.size));

    return rows.map((r) => ({
      inventoryItemId: r.id,
      size: r.size,
      availableQuantity: r.stockQuantity,
      categoryId: r.categoryId,
    }));
  }

  async listSerializedStock(): Promise<GearAvailabilitySizeResult[]> {
    const rows = await this.db
      .select({
        id: serializedItems.id,
        serialNumber: serializedItems.serialNumber,
        size: serializedItems.size,
        categoryId: serializedItems.categoryId,
      })
      .from(gearCategories)
      .innerJoin(serializedItems, eq(serializedItems.categoryId, gearCategories.id))
      .where(eq(serializedItems.status, 'AVAILABLE'))
      .orderBy(asc(serializedItems.serialNumber));

    return rows.map((r) => ({
      serializedItemId: r.id,
      serialNumber: r.serialNumber,
      size: r.size,
      availableQuantity: 1,
      categoryId: r.categoryId,
    }));
  }
}
