import { getTableName, sql } from 'drizzle-orm';
import {
  gearCategories,
  inventoryItems,
  serializedItems,
} from '../../../infrastructure/db/schema/index.js';
import { testDb } from '../common/db.js';
import { GEAR_CATEGORIES } from './constants.js';

export async function truncateGearStatusData(): Promise<void> {
  const tableName = getTableName(gearCategories);
  await testDb.execute(sql.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`));
}

export async function seedCategories() {
  const categoriesMap = new Map<string, string>();

  for (const cat of Object.values(GEAR_CATEGORIES)) {
    const [category] = await testDb
      .insert(gearCategories)
      .values({
        name: cat.name,
        trackingType: cat.trackingType,
        maxPerReservist: cat.maxPerReservist,
        requiresSize: cat.requiresSize,
      })
      .onConflictDoUpdate({
        target: gearCategories.name,
        set: { name: cat.name }, // Ensures RETURNING works even if row exists
      })
      .returning({ id: gearCategories.id, name: gearCategories.name });

    categoriesMap.set(category.name, category.id);
  }

  return categoriesMap;
}

export async function createInventoryItems(categoryId: string, sizes: string[], stockQuantity = 5) {
  const values = sizes.map((size) => ({
    categoryId,
    size,
    stockQuantity,
  }));

  const inserted = await testDb
    .insert(inventoryItems)
    .values(values)
    .returning({ id: inventoryItems.id, size: inventoryItems.size });

  return inserted;
}

export async function createSerializedItems(
  categoryId: string,
  prefix: string,
  sizes: string[],
  countPerSize = 2,
) {
  const items = [];

  for (const size of sizes) {
    for (let i = 1; i <= countPerSize; i++) {
      const serialNumber = `${prefix}-${size}-${i}`;
      items.push({
        categoryId,
        size,
        serialNumber,
        status: 'AVAILABLE' as const,
      });
    }
  }

  return testDb
    .insert(serializedItems)
    .values(items)
    .returning({ serializedNumber: serializedItems.serialNumber });
}

export async function findSerializedItemBySerialNumber(serialNumber: string) {
  const [item] = await testDb
    .select()
    .from(serializedItems)
    .where(sql`${serializedItems.serialNumber} = ${serialNumber}`)
    .limit(1);

  return item;
}

export async function findInventoryItemById(id: string) {
  const [item] = await testDb
    .select()
    .from(inventoryItems)
    .where(sql`${inventoryItems.id} = ${id}`)
    .limit(1);

  return item;
}
