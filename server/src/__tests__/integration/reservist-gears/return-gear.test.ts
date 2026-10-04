import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '../../utils/reservists/app.js';
import { buildCheckedInReservist, buildReservist } from '../../utils/reservists/factory.js';
import { seedReservist, truncateReservists } from '../../utils/reservists/query.js';
import { expectNoInternalDetailsLeaked } from '../../utils/reservist-gears/assertions.js';
import {
  GEAR_CATEGORIES,
  GEAR_SIZES,
  gearIssueUrl,
  gearReturnUrl,
  RESERVIST_GEAR_BROKEN_TABLE_NAME,
  RESERVIST_GEAR_TABLE_NAME,
  SERIALIZED_GEAR_DB_STATUSES,
  SERIALIZED_GEAR_RETURN_CONDITIONS,
} from '../../utils/reservist-gears/constants.js';
import {
  createInventoryItems,
  createSerializedItems,
  findInventoryItemById,
  findSerializedItemBySerialNumber,
  seedCategories,
  truncateGearStatusData,
} from '../../utils/reservist-gears/query.js';
import { HTTP_STATUS, STATE } from '../../utils/common/constants.js';
import { expectErrorResponse } from '../../utils/common/assertions.js';
import { withBrokenTable } from '../../utils/common/seed.js';
import { INVALID_RESERVIST_IDS } from '../../utils/common/invalid-inputs.js';

describe('POST /api/v1/reservists/:reservistId/gears/return', () => {
  beforeEach(async () => {
    await truncateReservists();
    await truncateGearStatusData();
  });

  describe('success', () => {
    it('when the reservist return gear successfully then responds 200 and gear status is updated in db', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);
      const helmetCategoryId = categories.get(GEAR_CATEGORIES.HELMET.name);

      if (!shirtCategoryId || !helmetCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const totalQuantity = 5;
      const issueQuantity = 2;
      const inventoryItems = await createInventoryItems(
        shirtCategoryId,
        [...GEAR_SIZES],
        totalQuantity,
      );
      const [serializedItem] = await createSerializedItems(helmetCategoryId, 'STATUS-HELMET', [
        ...GEAR_SIZES,
      ]);

      const mediumInventoryItem = inventoryItems.find((item) => item.size === 'M');
      if (!mediumInventoryItem || !serializedItem) {
        throw new Error('Failed to seed gear items');
      }

      await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: mediumInventoryItem.id, quantity: issueQuantity }],
          serialized: [{ serialNumber: serializedItem.serializedNumber }],
        });

      // Act
      const res = await api()
        .post(gearReturnUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: mediumInventoryItem.id, quantity: issueQuantity }],
          serialized: [
            {
              serialNumber: serializedItem.serializedNumber,
              condition: SERIALIZED_GEAR_RETURN_CONDITIONS.SERVICEABLE,
            },
          ],
        });
      const expectedInventoryItem = await findInventoryItemById(mediumInventoryItem.id);
      const expectedGearStatus = await findSerializedItemBySerialNumber(
        serializedItem.serializedNumber,
      );

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(expectedGearStatus.status).toEqual(SERIALIZED_GEAR_DB_STATUSES.AVAILABLE);
      expect(expectedInventoryItem?.stockQuantity).toBe(totalQuantity);
    });
  });

  describe('business logic', () => {
    it('when the reservist is not checked in then responds 400', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const [inventoryItem] = await createInventoryItems(shirtCategoryId, [...GEAR_SIZES]);

      if (!inventoryItem) {
        throw new Error('Failed to seed gear items');
      }

      // Act
      const res = await api()
        .post(gearReturnUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: inventoryItem.id, quantity: 1 }],
          serialized: [],
        });

      // Assert
      expectErrorResponse(res, HTTP_STATUS.BAD_REQUEST);
    });

    it('when the reservist is not found then responds 404', async () => {
      // Arrange
      const reservistId = crypto.randomUUID();

      // Act
      const res = await api()
        .post(gearReturnUrl(reservistId))
        .send({
          bulk: [],
          serialized: [
            {
              serialNumber: 'UNKNOWN-HELMET',
              condition: SERIALIZED_GEAR_RETURN_CONDITIONS.SERVICEABLE,
            },
          ],
        });

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
    });

    it('when the reservist returns more bulk gear than they are holding then responds 409', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const totalQuantity = 5;
      const issueQuantity = 1;
      const returnQuantity = 2;
      const [inventoryItem] = await createInventoryItems(
        shirtCategoryId,
        [...GEAR_SIZES],
        totalQuantity,
      );

      if (!inventoryItem) {
        throw new Error('Failed to seed gear items');
      }

      const issueResponse = await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: inventoryItem.id, quantity: issueQuantity }],
          serialized: [],
        });

      // Act
      const res = await api()
        .post(gearReturnUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: inventoryItem.id, quantity: returnQuantity }],
          serialized: [],
        });
      const expectedInventoryItem = await findInventoryItemById(inventoryItem.id);

      // Assert
      expect(issueResponse.status).toBe(HTTP_STATUS.OK);
      expectErrorResponse(res, HTTP_STATUS.CONFLICT);
      expect(expectedInventoryItem?.stockQuantity).toBe(totalQuantity - issueQuantity);
    });

    it('when the reservist returns a bulk gear item that is not found then responds 404', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());

      // Act
      const res = await api()
        .post(gearReturnUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: crypto.randomUUID(), quantity: 1 }],
          serialized: [],
        });

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
    });

    it('when the reservist returns a serialized gear item that is not found then responds 404', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());

      // Act
      const res = await api()
        .post(gearReturnUrl(reservist.id))
        .send({
          bulk: [],
          serialized: [
            {
              serialNumber: 'UNKNOWN-HELMET',
              condition: SERIALIZED_GEAR_RETURN_CONDITIONS.SERVICEABLE,
            },
          ],
        });

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
    });

    it('when the reservist returns serialized gear issued to another reservist then responds 404', async () => {
      // Arrange
      const issuingReservist = await seedReservist(buildCheckedInReservist());
      const returningReservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const helmetCategoryId = categories.get(GEAR_CATEGORIES.HELMET.name);

      if (!helmetCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const [serializedItem] = await createSerializedItems(helmetCategoryId, 'STATUS-HELMET', [
        ...GEAR_SIZES,
      ]);

      if (!serializedItem) {
        throw new Error('Failed to seed gear items');
      }

      const issueResponse = await api()
        .post(gearIssueUrl(issuingReservist.id))
        .send({
          bulk: [],
          serialized: [{ serialNumber: serializedItem.serializedNumber }],
        });

      // Act
      const res = await api()
        .post(gearReturnUrl(returningReservist.id))
        .send({
          bulk: [],
          serialized: [
            {
              serialNumber: serializedItem.serializedNumber,
              condition: SERIALIZED_GEAR_RETURN_CONDITIONS.SERVICEABLE,
            },
          ],
        });

      // Assert
      expect(issueResponse.status).toBe(HTTP_STATUS.OK);
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
    });

    it('when the reservist returns serialized gear that was already returned as lost then responds 404', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const helmetCategoryId = categories.get(GEAR_CATEGORIES.HELMET.name);

      if (!helmetCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const [serializedItem] = await createSerializedItems(helmetCategoryId, 'STATUS-HELMET', [
        ...GEAR_SIZES,
      ]);

      if (!serializedItem) {
        throw new Error('Failed to seed gear items');
      }

      const issueResponse = await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [],
          serialized: [{ serialNumber: serializedItem.serializedNumber }],
        });

      const lostReturnResponse = await api()
        .post(gearReturnUrl(reservist.id))
        .send({
          bulk: [],
          serialized: [
            {
              serialNumber: serializedItem.serializedNumber,
              condition: SERIALIZED_GEAR_RETURN_CONDITIONS.LOST,
            },
          ],
        });

      // Act
      const res = await api()
        .post(gearReturnUrl(reservist.id))
        .send({
          bulk: [],
          serialized: [
            {
              serialNumber: serializedItem.serializedNumber,
              condition: SERIALIZED_GEAR_RETURN_CONDITIONS.SERVICEABLE,
            },
          ],
        });
      const expectedSerializedItem = await findSerializedItemBySerialNumber(
        serializedItem.serializedNumber,
      );

      // Assert
      expect(issueResponse.status).toBe(HTTP_STATUS.OK);
      expect(lostReturnResponse.status).toBe(HTTP_STATUS.OK);
      expect(expectedSerializedItem?.status).toBe(SERIALIZED_GEAR_DB_STATUSES.LOST);
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
    });

    it('when two reservists return the same bulk gear then both requests succeed', async () => {
      // Arrange
      const reservist1 = await seedReservist(buildCheckedInReservist());
      const reservist2 = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const totalQuantity = 5;
      const issueQuantity = 1;
      const [inventoryItem] = await createInventoryItems(
        shirtCategoryId,
        [...GEAR_SIZES],
        totalQuantity,
      );

      if (!inventoryItem) {
        throw new Error('Failed to seed gear items');
      }

      const issueResponses = await Promise.all([
        api()
          .post(gearIssueUrl(reservist1.id))
          .send({
            bulk: [{ inventoryItemId: inventoryItem.id, quantity: issueQuantity }],
            serialized: [],
          }),
        api()
          .post(gearIssueUrl(reservist2.id))
          .send({
            bulk: [{ inventoryItemId: inventoryItem.id, quantity: issueQuantity }],
            serialized: [],
          }),
      ]);

      // Act
      const returnResponses = await Promise.all([
        api()
          .post(gearReturnUrl(reservist1.id))
          .send({
            bulk: [{ inventoryItemId: inventoryItem.id, quantity: issueQuantity }],
            serialized: [],
          }),
        api()
          .post(gearReturnUrl(reservist2.id))
          .send({
            bulk: [{ inventoryItemId: inventoryItem.id, quantity: issueQuantity }],
            serialized: [],
          }),
      ]);
      const expectedInventoryItem = await findInventoryItemById(inventoryItem.id);

      // Assert
      expect(issueResponses.map((response) => response.status)).toEqual([
        HTTP_STATUS.OK,
        HTTP_STATUS.OK,
      ]);
      expect(returnResponses.map((response) => response.status)).toEqual([
        HTTP_STATUS.OK,
        HTTP_STATUS.OK,
      ]);
      expect(expectedInventoryItem?.stockQuantity).toBe(totalQuantity);
    });

    it('when the reservist returns the same bulk gear twice in a row then one request fails and the other succeeds', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const totalQuantity = 5;
      const issueQuantity = 2;
      const returnQuantity = 1;
      const [inventoryItem] = await createInventoryItems(
        shirtCategoryId,
        [...GEAR_SIZES],
        totalQuantity,
      );

      if (!inventoryItem) {
        throw new Error('Failed to seed gear items');
      }

      const issueResponse = await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: inventoryItem.id, quantity: issueQuantity }],
          serialized: [],
        });

      // Act
      const responses = await Promise.all([
        api()
          .post(gearReturnUrl(reservist.id))
          .send({
            bulk: [{ inventoryItemId: inventoryItem.id, quantity: returnQuantity }],
            serialized: [],
          }),
        api()
          .post(gearReturnUrl(reservist.id))
          .send({
            bulk: [{ inventoryItemId: inventoryItem.id, quantity: returnQuantity }],
            serialized: [],
          }),
      ]);
      const expectedInventoryItem = await findInventoryItemById(inventoryItem.id);

      // Assert
      expect(issueResponse.status).toBe(HTTP_STATUS.OK);
      expect(responses.map((response) => response.status).sort()).toEqual([
        HTTP_STATUS.OK,
        HTTP_STATUS.CONFLICT,
      ]);
      expect(expectedInventoryItem?.stockQuantity).toBe(
        totalQuantity - issueQuantity + returnQuantity,
      );
    });
  });

  describe('validation error', () => {
    it.each(INVALID_RESERVIST_IDS)(
      'when reservistId is %j then responds 400',
      async (invalidId) => {
        // Arrange
        const reservist = await seedReservist(buildCheckedInReservist());

        // Act
        const res = await api()
          .post(gearIssueUrl(invalidId))
          .send({
            bulk: [{ inventoryItemId: reservist.id, quantity: 1 }],
            serialized: [],
          });

        // Assert
        expectErrorResponse(res, HTTP_STATUS.BAD_REQUEST);
      },
    );

    it.each([
      {
        name: 'empty request body',
        payload: {},
      },
      {
        name: 'empty bulk and serialized arrays',
        payload: { bulk: [], serialized: [] },
      },
      {
        name: 'invalid bulk inventory item uuid',
        payload: { bulk: [{ inventoryItemId: 'not-a-uuid', quantity: 1 }], serialized: [] },
      },
      {
        name: 'bulk quantity is zero',
        payload: {
          bulk: [{ inventoryItemId: '123e4567-e89b-12d3-a456-426614174000', quantity: 0 }],
          serialized: [],
        },
      },
      {
        name: 'bulk quantity is negative',
        payload: {
          bulk: [{ inventoryItemId: '123e4567-e89b-12d3-a456-426614174000', quantity: -1 }],
          serialized: [],
        },
      },
      {
        name: 'bulk quantity is not an integer',
        payload: {
          bulk: [{ inventoryItemId: '123e4567-e89b-12d3-a456-426614174000', quantity: 1.5 }],
          serialized: [],
        },
      },
      {
        name: 'bulk quantity exceeds the max',
        payload: {
          bulk: [{ inventoryItemId: '123e4567-e89b-12d3-a456-426614174000', quantity: 101 }],
          serialized: [],
        },
      },
      {
        name: 'serialized serial number is blank',
        payload: {
          bulk: [],
          serialized: [
            { serialNumber: '   ', condition: SERIALIZED_GEAR_RETURN_CONDITIONS.SERVICEABLE },
          ],
        },
      },
      {
        name: 'serialized serial number exceeds max length',
        payload: {
          bulk: [],
          serialized: [
            {
              serialNumber: 'A'.repeat(101),
              condition: SERIALIZED_GEAR_RETURN_CONDITIONS.SERVICEABLE,
            },
          ],
        },
      },
      {
        name: 'duplicate serialized serial numbers',
        payload: {
          bulk: [],
          serialized: [
            { serialNumber: 'SER-001', condition: SERIALIZED_GEAR_RETURN_CONDITIONS.SERVICEABLE },
            { serialNumber: 'SER-001', condition: SERIALIZED_GEAR_RETURN_CONDITIONS.SERVICEABLE },
          ],
        },
      },
      {
        name: 'duplicate serialized serial numbers after trim',
        payload: {
          bulk: [],
          serialized: [
            {
              serialNumber: '  SER-002  ',
              condition: SERIALIZED_GEAR_RETURN_CONDITIONS.SERVICEABLE,
            },
            { serialNumber: 'SER-002', condition: SERIALIZED_GEAR_RETURN_CONDITIONS.SERVICEABLE },
          ],
        },
      },
      {
        name: 'serialized condition is blank',
        payload: { bulk: [], serialized: [{ serialNumber: 'SER-001', condition: '   ' }] },
      },
      {
        name: 'serialized condition is invalid',
        payload: { bulk: [], serialized: [{ serialNumber: 'SER-001', condition: 'INVALID' }] },
      },
    ])('when the request payload has %s then responds 400', async ({ payload }) => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());

      // Act
      const res = await api().post(gearReturnUrl(reservist.id)).send(payload);

      // Assert
      expectErrorResponse(res, HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('server error', () => {
    it('when the database fails then responds 500 without leaking internal details', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const [inventoryItem] = await createInventoryItems(shirtCategoryId, [...GEAR_SIZES]);

      if (!inventoryItem) {
        throw new Error('Failed to seed gear items');
      }

      // Act
      const res = await withBrokenTable(
        () =>
          api()
            .post(gearReturnUrl(reservist.id))
            .send({ bulk: [{ inventoryItemId: inventoryItem.id, quantity: 1 }], serialized: [] }),
        {
          TABLE_NAME: RESERVIST_GEAR_TABLE_NAME,
          BROKEN_TABLE_NAME: RESERVIST_GEAR_BROKEN_TABLE_NAME,
        },
      );

      // Assert
      expectErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expectNoInternalDetailsLeaked(res);
    });

    it('when the database fails then no gear is returned and the data remains unchanged', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);
      const helmetCategoryId = categories.get(GEAR_CATEGORIES.HELMET.name);

      if (!shirtCategoryId || !helmetCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const totalQuantity = 5;
      const issueQuantity = 2;
      const inventoryItems = await createInventoryItems(
        shirtCategoryId,
        [...GEAR_SIZES],
        totalQuantity,
      );
      const [serializedItem] = await createSerializedItems(helmetCategoryId, 'STATUS-HELMET', [
        ...GEAR_SIZES,
      ]);
      const mediumInventoryItem = inventoryItems.find((item) => item.size === 'M');

      if (!mediumInventoryItem || !serializedItem) {
        throw new Error('Failed to seed gear items');
      }

      await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: mediumInventoryItem.id, quantity: issueQuantity }],
          serialized: [{ serialNumber: serializedItem.serializedNumber }],
        });

      const beforeSerialized = await findSerializedItemBySerialNumber(
        serializedItem.serializedNumber,
      );
      const beforeInventory = await findInventoryItemById(mediumInventoryItem.id);

      // Act
      await withBrokenTable(
        () =>
          api()
            .post(gearReturnUrl(reservist.id))
            .send({
              bulk: [{ inventoryItemId: mediumInventoryItem.id, quantity: issueQuantity }],
              serialized: [
                {
                  serialNumber: serializedItem.serializedNumber,
                  condition: SERIALIZED_GEAR_RETURN_CONDITIONS.SERVICEABLE,
                },
              ],
            }),
        {
          TABLE_NAME: RESERVIST_GEAR_TABLE_NAME,
          BROKEN_TABLE_NAME: RESERVIST_GEAR_BROKEN_TABLE_NAME,
        },
      );
      const afterSerialized = await findSerializedItemBySerialNumber(
        serializedItem.serializedNumber,
      );
      const afterInventory = await findInventoryItemById(mediumInventoryItem.id);

      // Assert
      expect(beforeSerialized?.status).toBe(SERIALIZED_GEAR_DB_STATUSES.ISSUED);
      expect(afterSerialized?.status).toBe(beforeSerialized?.status);
      expect(beforeInventory?.stockQuantity).toBe(totalQuantity - issueQuantity);
      expect(afterInventory?.stockQuantity).toBe(beforeInventory?.stockQuantity);
    });

    it('when the database recovers after a failure then the return succeeds', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);
      const helmetCategoryId = categories.get(GEAR_CATEGORIES.HELMET.name);

      if (!shirtCategoryId || !helmetCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const totalQuantity = 5;
      const issueQuantity = 2;
      const inventoryItems = await createInventoryItems(
        shirtCategoryId,
        [...GEAR_SIZES],
        totalQuantity,
      );
      const [serializedItem] = await createSerializedItems(helmetCategoryId, 'STATUS-HELMET', [
        ...GEAR_SIZES,
      ]);
      const mediumInventoryItem = inventoryItems.find((item) => item.size === 'M');

      if (!mediumInventoryItem || !serializedItem) {
        throw new Error('Failed to seed gear items');
      }

      await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: mediumInventoryItem.id, quantity: issueQuantity }],
          serialized: [{ serialNumber: serializedItem.serializedNumber }],
        });

      const failed = await withBrokenTable(
        () =>
          api()
            .post(gearReturnUrl(reservist.id))
            .send({
              bulk: [{ inventoryItemId: mediumInventoryItem.id, quantity: issueQuantity }],
              serialized: [
                {
                  serialNumber: serializedItem.serializedNumber,
                  condition: SERIALIZED_GEAR_RETURN_CONDITIONS.DAMAGED,
                },
              ],
            }),
        {
          TABLE_NAME: RESERVIST_GEAR_TABLE_NAME,
          BROKEN_TABLE_NAME: RESERVIST_GEAR_BROKEN_TABLE_NAME,
        },
      );

      // Act
      const recovered = await api()
        .post(gearReturnUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: mediumInventoryItem.id, quantity: issueQuantity }],
          serialized: [
            {
              serialNumber: serializedItem.serializedNumber,
              condition: SERIALIZED_GEAR_RETURN_CONDITIONS.SERVICEABLE,
            },
          ],
        });

      // Assert
      expect(failed.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(recovered.status).toBe(HTTP_STATUS.OK);
      expect(recovered.body.state).toBe(STATE.SUCCESS);
    });
  });
});
