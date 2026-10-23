import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { inventoryLogs } from '../../../infrastructure/db/schema/inventory-logs.js';
import { api } from '../../utils/common/app.js';
import { expectErrorResponse } from '../../utils/common/assertions.js';
import { HTTP_STATUS, STATE } from '../../utils/common/constants.js';
import { withBrokenTable } from '../../utils/common/seed.js';
import {
  INVENTORY_LOGS_BROKEN_TABLE_NAME,
  INVENTORY_LOGS_TABLE_NAME,
  INVENTORIES_URL,
} from '../../utils/inventory-items/constants.js';
import {
  createInventoryItems,
  createSerializedItems,
  findInventoryItemById,
  findSerializedItemBySerialNumber,
  seedCategories,
  truncateGearStatusData,
} from '../../utils/reservist-gears/query.js';
import {
  GEAR_CATEGORIES,
  SERIALIZED_GEAR_DB_STATUSES,
} from '../../utils/reservist-gears/constants.js';
import { testDb } from '../../utils/common/db.js';

describe('POST /api/v1/inventories/adjustment', () => {
  beforeEach(async () => {
    await truncateGearStatusData();
  });

  describe('success', () => {
    it('when stock is adjusted then responds 200 and persists the stock change and log', async () => {
      // Arrange
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed inventory category');
      }

      const initialStock = 5;
      const adjustmentQuantity = 2;
      const [inventoryItem] = await createInventoryItems(shirtCategoryId, ['M'], initialStock);

      if (!inventoryItem) {
        throw new Error('Failed to seed inventory item');
      }

      const adjustment = {
        inventoryItemId: inventoryItem.id,
        type: 'DECREASE',
        quantity: adjustmentQuantity,
        reason: 'DAMAGED',
        note: 'Damaged during inspection',
        performBy: 'Quartermaster',
      };

      // Act
      const res = await api()
        .post(`${INVENTORIES_URL}/adjustment`)
        .send({ adjustments: [adjustment] });
      const updatedItem = await findInventoryItemById(inventoryItem.id);
      const [log] = await testDb
        .select()
        .from(inventoryLogs)
        .where(eq(inventoryLogs.inventoryItemId, inventoryItem.id));

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.state).toBe(STATE.SUCCESS);
      expect(res.body.data).toContainEqual(
        expect.objectContaining({
          inventoryId: inventoryItem.id,
          stockQuantity: initialStock - adjustmentQuantity,
        }),
      );
      expect(updatedItem?.stockQuantity).toBe(initialStock - adjustmentQuantity);
      expect(log).toEqual(
        expect.objectContaining({
          inventoryItemId: inventoryItem.id,
          actionType: adjustment.type,
          quantity: adjustmentQuantity,
          reason: adjustment.reason,
          note: adjustment.note,
          performBy: adjustment.performBy,
        }),
      );
    });

    it('when increasing from zero without a note then defaults the note to null and trims the performer', async () => {
      // Arrange
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed inventory category');
      }

      const [inventoryItem] = await createInventoryItems(shirtCategoryId, ['M'], 0);

      if (!inventoryItem) {
        throw new Error('Failed to seed inventory item');
      }

      // Act
      const res = await api()
        .post(`${INVENTORIES_URL}/adjustment`)
        .send({
          adjustments: [
            {
              inventoryItemId: inventoryItem.id,
              type: 'INCREASE',
              quantity: 1,
              reason: 'RECEIVED',
              performBy: '  Quartermaster  ',
            },
          ],
        });
      const updatedItem = await findInventoryItemById(inventoryItem.id);
      const [log] = await testDb
        .select()
        .from(inventoryLogs)
        .where(eq(inventoryLogs.inventoryItemId, inventoryItem.id));

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.state).toBe(STATE.SUCCESS);
      expect(updatedItem?.stockQuantity).toBe(1);
      expect(log).toEqual(
        expect.objectContaining({
          actionType: 'INCREASE',
          quantity: 1,
          reason: 'RECEIVED',
          note: null,
          performBy: 'Quartermaster',
        }),
      );
    });

    it('when decreasing the exact available stock then succeeds with zero stock', async () => {
      // Arrange
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed inventory category');
      }

      const [inventoryItem] = await createInventoryItems(shirtCategoryId, ['M'], 3);

      if (!inventoryItem) {
        throw new Error('Failed to seed inventory item');
      }

      // Act
      const res = await api()
        .post(`${INVENTORIES_URL}/adjustment`)
        .send({
          adjustments: [
            {
              inventoryItemId: inventoryItem.id,
              type: 'DECREASE',
              quantity: 3,
              reason: 'COUNT_CORRECTION',
              note: null,
              performBy: 'Quartermaster',
            },
          ],
        });
      const updatedItem = await findInventoryItemById(inventoryItem.id);

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.state).toBe(STATE.SUCCESS);
      expect(updatedItem?.stockQuantity).toBe(0);
    });

    it('when note and performer are at their maximum lengths then succeeds', async () => {
      // Arrange
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed inventory category');
      }

      const [inventoryItem] = await createInventoryItems(shirtCategoryId, ['M'], 0);

      if (!inventoryItem) {
        throw new Error('Failed to seed inventory item');
      }

      const note = 'n'.repeat(500);
      const performBy = 'p'.repeat(100);

      // Act
      const res = await api()
        .post(`${INVENTORIES_URL}/adjustment`)
        .send({
          adjustments: [
            {
              inventoryItemId: inventoryItem.id,
              type: 'INCREASE',
              quantity: 1,
              reason: 'COUNT_CORRECTION',
              note,
              performBy,
            },
          ],
        });
      const [log] = await testDb
        .select()
        .from(inventoryLogs)
        .where(eq(inventoryLogs.inventoryItemId, inventoryItem.id));

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.state).toBe(STATE.SUCCESS);
      expect(log?.note).toBe(note);
      expect(log?.performBy).toBe(performBy);
    });
  });

  describe('validation error', () => {
    const duplicateInventoryItemId = crypto.randomUUID();

    it.each([
      { description: 'an array request body', body: [] },
      { description: 'no adjustments', body: {} },
      { description: 'null adjustments', body: { adjustments: null } },
      { description: 'adjustments that are not an array', body: { adjustments: 'invalid' } },
      { description: 'an empty adjustments array', body: { adjustments: [] } },
      { description: 'a null adjustment', body: { adjustments: [null] } },
      { description: 'an empty adjustment object', body: { adjustments: [{}] } },
      {
        description: 'a missing inventory item id',
        body: {
          adjustments: [
            {
              type: 'INCREASE',
              quantity: 1,
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
          ],
        },
      },
      {
        description: 'an invalid inventory item id',
        body: {
          adjustments: [
            {
              inventoryItemId: 'not-a-uuid',
              type: 'INCREASE',
              quantity: 1,
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
          ],
        },
      },
      {
        description: 'an invalid adjustment type',
        body: {
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INVALID',
              quantity: 1,
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
          ],
        },
      },
      {
        description: 'a missing adjustment type',
        body: {
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              quantity: 1,
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
          ],
        },
      },
      {
        description: 'a non-positive adjustment quantity',
        body: {
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INCREASE',
              quantity: 0,
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
          ],
        },
      },
      {
        description: 'a missing adjustment quantity',
        body: {
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INCREASE',
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
          ],
        },
      },
      {
        description: 'a negative adjustment quantity',
        body: {
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INCREASE',
              quantity: -1,
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
          ],
        },
      },
      {
        description: 'a fractional adjustment quantity',
        body: {
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INCREASE',
              quantity: 1.5,
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
          ],
        },
      },
      {
        description: 'a string adjustment quantity',
        body: {
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INCREASE',
              quantity: '1',
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
          ],
        },
      },
      {
        description: 'an invalid adjustment reason',
        body: {
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INCREASE',
              quantity: 1,
              reason: 'INVALID',
              performBy: 'Quartermaster',
            },
          ],
        },
      },
      {
        description: 'a missing adjustment reason',
        body: {
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INCREASE',
              quantity: 1,
              performBy: 'Quartermaster',
            },
          ],
        },
      },
      {
        description: 'a note that is not a string or null',
        body: {
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INCREASE',
              quantity: 1,
              reason: 'RECEIVED',
              note: 1,
              performBy: 'Quartermaster',
            },
          ],
        },
      },
      {
        description: 'a note longer than 500 characters',
        body: {
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INCREASE',
              quantity: 1,
              reason: 'RECEIVED',
              note: 'x'.repeat(501),
              performBy: 'Quartermaster',
            },
          ],
        },
      },
      {
        description: 'a missing performer',
        body: {
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INCREASE',
              quantity: 1,
              reason: 'RECEIVED',
            },
          ],
        },
      },
      {
        description: 'a blank performer',
        body: {
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INCREASE',
              quantity: 1,
              reason: 'RECEIVED',
              performBy: ' ',
            },
          ],
        },
      },
      {
        description: 'a performer longer than 100 characters',
        body: {
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INCREASE',
              quantity: 1,
              reason: 'RECEIVED',
              performBy: 'x'.repeat(101),
            },
          ],
        },
      },
      {
        description: 'duplicate inventory item ids',
        body: {
          adjustments: [
            {
              inventoryItemId: duplicateInventoryItemId,
              type: 'INCREASE',
              quantity: 1,
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
            {
              inventoryItemId: duplicateInventoryItemId,
              type: 'DECREASE',
              quantity: 1,
              reason: 'LOST',
              performBy: 'Quartermaster',
            },
          ],
        },
      },
    ])('when the request contains $description then responds 400', async ({ body }) => {
      // Act
      const res = await api()
        .post(`${INVENTORIES_URL}/adjustment`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(body));

      // Assert
      expectErrorResponse(res, HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('business logic', () => {
    it('when the inventory item does not exist then responds 404', async () => {
      // Act
      const res = await api()
        .post(`${INVENTORIES_URL}/adjustment`)
        .send({
          adjustments: [
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INCREASE',
              quantity: 1,
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
          ],
        });

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
    });

    it('when the inventory item is serialized then responds 404', async () => {
      // Arrange
      const categories = await seedCategories();
      const helmetCategoryId = categories.get(GEAR_CATEGORIES.HELMET.name);

      if (!helmetCategoryId) {
        throw new Error('Failed to seed inventory category');
      }

      const [createdItem] = await createSerializedItems(
        helmetCategoryId,
        'ADJUSTMENT-HELMET',
        ['M'],
        1,
      );

      if (!createdItem) {
        throw new Error('Failed to seed serialized item');
      }

      const serializedItem = await findSerializedItemBySerialNumber(createdItem.serializedNumber);
      if (!serializedItem) {
        throw new Error('Failed to find seeded serialized item');
      }

      // Act
      const res = await api()
        .post(`${INVENTORIES_URL}/adjustment`)
        .send({
          adjustments: [
            {
              inventoryItemId: serializedItem.id,
              type: 'INCREASE',
              quantity: 1,
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
          ],
        });
      const unchangedSerializedItem = await findSerializedItemBySerialNumber(
        serializedItem.serialNumber,
      );

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
      expect(unchangedSerializedItem?.status).toBe(SERIALIZED_GEAR_DB_STATUSES.AVAILABLE);
    });

    it('when the decrease exceeds available stock then responds 409 and leaves the item unchanged', async () => {
      // Arrange
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed inventory category');
      }

      const initialStock = 5;
      const [inventoryItem] = await createInventoryItems(shirtCategoryId, ['M'], initialStock);

      if (!inventoryItem) {
        throw new Error('Failed to seed inventory item');
      }

      // Act
      const res = await api()
        .post(`${INVENTORIES_URL}/adjustment`)
        .send({
          adjustments: [
            {
              inventoryItemId: inventoryItem.id,
              type: 'DECREASE',
              quantity: initialStock + 1,
              reason: 'LOST',
              performBy: 'Quartermaster',
            },
          ],
        });
      const unchangedItem = await findInventoryItemById(inventoryItem.id);
      const logs = await testDb
        .select()
        .from(inventoryLogs)
        .where(eq(inventoryLogs.inventoryItemId, inventoryItem.id));

      // Assert
      expectErrorResponse(res, HTTP_STATUS.CONFLICT);
      expect(unchangedItem?.stockQuantity).toBe(initialStock);
      expect(logs).toHaveLength(0);
    });

    it('when any item in a batch is missing then does not adjust or log the other items', async () => {
      // Arrange
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed inventory category');
      }

      const [inventoryItem] = await createInventoryItems(shirtCategoryId, ['M'], 5);

      if (!inventoryItem) {
        throw new Error('Failed to seed inventory item');
      }

      // Act
      const res = await api()
        .post(`${INVENTORIES_URL}/adjustment`)
        .send({
          adjustments: [
            {
              inventoryItemId: inventoryItem.id,
              type: 'INCREASE',
              quantity: 1,
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
            {
              inventoryItemId: crypto.randomUUID(),
              type: 'INCREASE',
              quantity: 1,
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
          ],
        });
      const unchangedItem = await findInventoryItemById(inventoryItem.id);
      const logs = await testDb
        .select()
        .from(inventoryLogs)
        .where(eq(inventoryLogs.inventoryItemId, inventoryItem.id));

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
      expect(unchangedItem?.stockQuantity).toBe(5);
      expect(logs).toHaveLength(0);
    });

    it('when a batch contains a decrease exceeding stock then rolls back every adjustment', async () => {
      // Arrange
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed inventory category');
      }

      const [firstItem, secondItem] = await createInventoryItems(shirtCategoryId, ['M', 'S'], 5);

      if (!firstItem || !secondItem) {
        throw new Error('Failed to seed inventory items');
      }

      // Act
      const res = await api()
        .post(`${INVENTORIES_URL}/adjustment`)
        .send({
          adjustments: [
            {
              inventoryItemId: firstItem.id,
              type: 'INCREASE',
              quantity: 1,
              reason: 'RECEIVED',
              performBy: 'Quartermaster',
            },
            {
              inventoryItemId: secondItem.id,
              type: 'DECREASE',
              quantity: 6,
              reason: 'LOST',
              performBy: 'Quartermaster',
            },
          ],
        });
      const firstItemAfter = await findInventoryItemById(firstItem.id);
      const secondItemAfter = await findInventoryItemById(secondItem.id);
      const logs = await testDb.select().from(inventoryLogs);

      // Assert
      expectErrorResponse(res, HTTP_STATUS.CONFLICT);
      expect(firstItemAfter?.stockQuantity).toBe(5);
      expect(secondItemAfter?.stockQuantity).toBe(5);
      expect(logs).toHaveLength(0);
    });
  });

  describe('server error', () => {
    it('when the inventory log table is unavailable then responds 500', async () => {
      // Arrange
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed inventory category');
      }

      const [inventoryItem] = await createInventoryItems(shirtCategoryId, ['M']);

      if (!inventoryItem) {
        throw new Error('Failed to seed inventory item');
      }

      // Act
      const res = await withBrokenTable(
        () =>
          api()
            .post(`${INVENTORIES_URL}/adjustment`)
            .send({
              adjustments: [
                {
                  inventoryItemId: inventoryItem.id,
                  type: 'INCREASE',
                  quantity: 1,
                  reason: 'RECEIVED',
                  performBy: 'Quartermaster',
                },
              ],
            }),
        {
          TABLE_NAME: INVENTORY_LOGS_TABLE_NAME,
          BROKEN_TABLE_NAME: INVENTORY_LOGS_BROKEN_TABLE_NAME,
        },
      );
      const unchangedItem = await findInventoryItemById(inventoryItem.id);

      // Assert
      expectErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(unchangedItem?.stockQuantity).toBe(5);
    });
  });
});
