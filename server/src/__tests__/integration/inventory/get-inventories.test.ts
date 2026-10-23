import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '../../utils/common/app.js';
import { HTTP_STATUS, STATE } from '../../utils/common/constants.js';
import {
  createInventoryItems,
  seedCategories,
  truncateGearStatusData,
} from '../../utils/reservist-gears/query.js';
import { GEAR_CATEGORIES } from '../../utils/reservist-gears/constants.js';
import { INVENTORIES_URL } from '../../utils/inventory-items/constants.js';

describe('GET /api/v1/inventories', () => {
  beforeEach(async () => {
    await truncateGearStatusData();
  });

  describe('success', () => {
    it('when no inventory items exist then responds 200 with an empty list', async () => {
      // Act
      const res = await api().get(INVENTORIES_URL);

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.state).toBe(STATE.SUCCESS);
      expect(res.body.data).toEqual([]);
    });

    it('when inventory items exist then responds 200 ordered by name and size ascending', async () => {
      // Arrange
      const categories = await seedCategories();
      const pantsCategoryId = categories.get(GEAR_CATEGORIES.PANTS.name);
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!pantsCategoryId || !shirtCategoryId) {
        throw new Error('Failed to seed inventory categories');
      }

      const pants = await createInventoryItems(pantsCategoryId, ['M', 'S']);
      const shirts = await createInventoryItems(shirtCategoryId, ['M', 'S']);

      // Act
      const res = await api().get(INVENTORIES_URL);

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.state).toBe(STATE.SUCCESS);
      expect(
        res.body.data.map((item: { name: string; size: string }) => [item.name, item.size]),
      ).toEqual([
        [GEAR_CATEGORIES.PANTS.name, 'M'],
        [GEAR_CATEGORIES.PANTS.name, 'S'],
        [GEAR_CATEGORIES.SHIRT.name, 'M'],
        [GEAR_CATEGORIES.SHIRT.name, 'S'],
      ]);
      expect(res.body.data.map((item: { inventoryId: string }) => item.inventoryId)).toEqual([
        pants.find((item) => item.size === 'M')?.id,
        pants.find((item) => item.size === 'S')?.id,
        shirts.find((item) => item.size === 'M')?.id,
        shirts.find((item) => item.size === 'S')?.id,
      ]);
    });
  });
});
