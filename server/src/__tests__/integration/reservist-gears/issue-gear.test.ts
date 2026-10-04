import { beforeEach, describe, expect, it } from 'vitest';

import { GearReadRepository } from '../../../domains/gears/repository/gear-read.repository.js';
import { api } from '../../utils/reservists/app.js';
import { testDb } from '../../utils/common/db.js';
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
import { INVALID_RESERVIST_IDS } from '../../utils/common/invalid-inputs.js';
import { expectErrorResponse } from '../../utils/common/assertions.js';
import { GearWriteRepository } from '../../../domains/gears/repository/gear-write.repository.js';
import { GearService } from '../../../domains/gears/service/service.js';
import { ReservistRepository } from '../../../domains/reservists/repository/repository.js';
import { withBrokenTable } from '../../utils/common/seed.js';

const gearReadRepository = new GearReadRepository(testDb);
const gearWriteRepository = new GearWriteRepository(testDb);
const reservistRepository = new ReservistRepository(testDb);
const gearService = new GearService(gearReadRepository, gearWriteRepository, reservistRepository);

describe('POST /api/v1/reservists/:reservistId/gears/issue', () => {
  beforeEach(async () => {
    await truncateReservists();
    await truncateGearStatusData();
  });

  describe('success', () => {
    it('when the reservist issue bulk and serialized gear then responds 200 with their current gear status', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);
      const helmetCategoryId = categories.get(GEAR_CATEGORIES.HELMET.name);

      if (!shirtCategoryId || !helmetCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const inventoryItems = await createInventoryItems(shirtCategoryId, [...GEAR_SIZES]);
      const [serializedItem] = await createSerializedItems(helmetCategoryId, 'STATUS-HELMET', [
        ...GEAR_SIZES,
      ]);
      const mediumInventoryItem = inventoryItems.find((item) => item.size === 'M');

      if (!mediumInventoryItem || !serializedItem) {
        throw new Error('Failed to seed gear items');
      }

      // Act
      const res = await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: mediumInventoryItem.id, quantity: 2 }],
          serialized: [{ serialNumber: serializedItem.serializedNumber }],
        });
      const expectedGearStatus = await gearService.getGear(reservist.id);

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data).toEqual(expectedGearStatus);
      expect(res.body.state).toBe(STATE.SUCCESS);
      expectNoInternalDetailsLeaked(res);
      expect(res.body.data).toEqual(expectedGearStatus);
    });

    it('when the reservist issue bulk and serialized gear then database should reflect the changes', async () => {
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

      // Act
      await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: mediumInventoryItem.id, quantity: issueQuantity }],
          serialized: [{ serialNumber: serializedItem.serializedNumber }],
        });
      const expectedSerializedGearStatus = await findSerializedItemBySerialNumber(
        serializedItem.serializedNumber,
      );
      const expectedInventoryGearStatus = await findInventoryItemById(mediumInventoryItem.id);
      // Assert
      expect(expectedSerializedGearStatus?.status).toBe(SERIALIZED_GEAR_DB_STATUSES.ISSUED);
      expect(expectedInventoryGearStatus?.stockQuantity).toBe(totalQuantity - issueQuantity);
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
        .post(gearIssueUrl(reservist.id))
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
        .post(gearIssueUrl(reservistId))
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

    it('when the reservist issue bulk gear that exceeds their allowance then responds 409', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const totalQuantity = 5;
      const issueQuantity = 2;
      const [inventoryItemS, inventoryItemM] = await createInventoryItems(
        shirtCategoryId,
        [...GEAR_SIZES],
        totalQuantity,
      );

      if (!inventoryItemS || !inventoryItemM) {
        throw new Error('Failed to seed gear items');
      }

      // Act
      const res = await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [
            { inventoryItemId: inventoryItemS.id, quantity: issueQuantity },
            { inventoryItemId: inventoryItemM.id, quantity: issueQuantity },
          ],
          serialized: [],
        });
      const expectedInventoryGearStatusM = await findInventoryItemById(inventoryItemM.id);
      const expectedInventoryGearStatusS = await findInventoryItemById(inventoryItemS.id);

      // Assert
      expectErrorResponse(res, HTTP_STATUS.CONFLICT);
      expect(expectedInventoryGearStatusS?.stockQuantity).toBe(totalQuantity);
      expect(expectedInventoryGearStatusM?.stockQuantity).toBe(totalQuantity);
    });

    it('when the reservist issue serialized gear that exceeds their allowance then responds 409', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const helmetCategoryId = categories.get(GEAR_CATEGORIES.HELMET.name);

      if (!helmetCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const [serializedItem1, serializedItem2] = await createSerializedItems(
        helmetCategoryId,
        'STATUS-HELMET',
        [...GEAR_SIZES],
      );

      if (!serializedItem1 || !serializedItem2) {
        throw new Error('Failed to seed gear items');
      }

      // Act
      const res = await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [],
          serialized: [
            { serialNumber: serializedItem1.serializedNumber },
            { serialNumber: serializedItem2.serializedNumber },
          ],
        });
      const expectedSerializedGearStatus1 = await findSerializedItemBySerialNumber(
        serializedItem1.serializedNumber,
      );
      const expectedSerializedGearStatus2 = await findSerializedItemBySerialNumber(
        serializedItem2.serializedNumber,
      );

      // Assert
      expectErrorResponse(res, HTTP_STATUS.CONFLICT);
      expect(expectedSerializedGearStatus1?.status).toBe(SERIALIZED_GEAR_DB_STATUSES.AVAILABLE);
      expect(expectedSerializedGearStatus2?.status).toBe(SERIALIZED_GEAR_DB_STATUSES.AVAILABLE);
    });

    it('when the reservist issue bulk gear that exceeds the available stock then responds 409', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const totalQuantity = 2;
      const issueQuantity = 3;
      const [inventoryItem] = await createInventoryItems(
        shirtCategoryId,
        [...GEAR_SIZES],
        totalQuantity,
      );

      if (!inventoryItem) {
        throw new Error('Failed to seed gear items');
      }

      // Act
      const res = await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: inventoryItem.id, quantity: issueQuantity }],
          serialized: [],
        });
      const expectedInventoryGearStatus = await findInventoryItemById(inventoryItem.id);

      // Assert
      expectErrorResponse(res, HTTP_STATUS.CONFLICT);
      expect(expectedInventoryGearStatus?.stockQuantity).toBe(totalQuantity);
    });

    it('when the reservist issue bulk gear that is not found then responds 404', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());

      // Act
      const res = await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: crypto.randomUUID(), quantity: 1 }],
          serialized: [],
        });

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
    });

    it('when the reservist issue serialized gear that is not found then responds 404', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());

      // Act
      const res = await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [],
          serialized: [{ serialNumber: crypto.randomUUID() }],
        });

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
    });

    it('when the reservist issue serialized gear that is already issued then responds 409', async () => {
      // Arrange
      const reservist1 = await seedReservist(buildCheckedInReservist());
      const reservist2 = await seedReservist(buildCheckedInReservist());
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

      // Act
      await api()
        .post(gearIssueUrl(reservist1.id))
        .send({
          bulk: [],
          serialized: [{ serialNumber: serializedItem.serializedNumber }],
        });

      const res = await api()
        .post(gearIssueUrl(reservist2.id))
        .send({
          bulk: [],
          serialized: [{ serialNumber: serializedItem.serializedNumber }],
        });
      const expectedSerializedGearStatus = await findSerializedItemBySerialNumber(
        serializedItem.serializedNumber,
      );

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
      expect(expectedSerializedGearStatus?.status).toBe(SERIALIZED_GEAR_DB_STATUSES.ISSUED);
    });

    it('when the reservist issue serialized gear that is lost or damaged then responds 409', async () => {
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

      // Act
      await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [],
          serialized: [{ serialNumber: serializedItem.serializedNumber }],
        });
      await api()
        .post(gearReturnUrl(reservist.id))
        .send({
          bulk: [],
          serialized: [
            {
              serialNumber: serializedItem.serializedNumber,
              condition: SERIALIZED_GEAR_RETURN_CONDITIONS.DAMAGED,
            },
          ],
        });

      const res = await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [],
          serialized: [{ serialNumber: serializedItem.serializedNumber }],
        });
      const expectedSerializedGearStatus = await findSerializedItemBySerialNumber(
        serializedItem.serializedNumber,
      );

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
      expect(expectedSerializedGearStatus?.status).toBe(SERIALIZED_GEAR_DB_STATUSES.MAINTENANCE);
    });

    it('when the reservist issue gear twice in a row then one request fails and the other succeeds', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const helmetCategoryId = categories.get(GEAR_CATEGORIES.HELMET.name);
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!helmetCategoryId || !shirtCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const [serializedItem] = await createSerializedItems(helmetCategoryId, 'STATUS-HELMET', [
        ...GEAR_SIZES,
      ]);

      if (!serializedItem) {
        throw new Error('Failed to seed gear items');
      }

      const totalQuantity = 5;
      const issueQuantity = 2;
      const [inventoryItem] = await createInventoryItems(
        shirtCategoryId,
        [...GEAR_SIZES],
        totalQuantity,
      );

      if (!inventoryItem) {
        throw new Error('Failed to seed gear items');
      }

      // Act
      await Promise.all([
        api()
          .post(gearIssueUrl(reservist.id))
          .send({
            bulk: [{ inventoryItemId: inventoryItem.id, quantity: issueQuantity }],
            serialized: [{ serialNumber: serializedItem.serializedNumber }],
          }),
        api()
          .post(gearIssueUrl(reservist.id))
          .send({
            bulk: [{ inventoryItemId: inventoryItem.id, quantity: issueQuantity }],
            serialized: [{ serialNumber: serializedItem.serializedNumber }],
          }),
      ]);

      const expectedSerializedGearStatus = await findSerializedItemBySerialNumber(
        serializedItem.serializedNumber,
      );
      const expectedInventoryGearStatus = await findInventoryItemById(inventoryItem.id);

      // Assert
      expect(expectedSerializedGearStatus?.status).toBe(SERIALIZED_GEAR_DB_STATUSES.ISSUED);
      expect(expectedInventoryGearStatus.stockQuantity).toBe(totalQuantity - issueQuantity);
    });

    it('when two reservists issue the same serialized gear then one request fails and the other succeeds', async () => {
      // Arrange
      const reservist1 = await seedReservist(buildCheckedInReservist());
      const reservist2 = await seedReservist(buildCheckedInReservist());
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

      // Act
      await Promise.all([
        api()
          .post(gearIssueUrl(reservist1.id))
          .send({
            bulk: [],
            serialized: [{ serialNumber: serializedItem.serializedNumber }],
          }),
        api()
          .post(gearIssueUrl(reservist2.id))
          .send({
            bulk: [],
            serialized: [{ serialNumber: serializedItem.serializedNumber }],
          }),
      ]);

      const expectedSerializedGearStatus = await findSerializedItemBySerialNumber(
        serializedItem.serializedNumber,
      );
      // Assert
      expect(expectedSerializedGearStatus?.status).toBe(SERIALIZED_GEAR_DB_STATUSES.ISSUED);
    });

    it('when two reservists issue the same bulk gear then both requests succeeds', async () => {
      // Arrange
      const reservist1 = await seedReservist(buildCheckedInReservist());
      const reservist2 = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const totalQuantity = 5;
      const issueQuantity = 2;
      const [inventoryItem] = await createInventoryItems(
        shirtCategoryId,
        [...GEAR_SIZES],
        totalQuantity,
      );

      if (!inventoryItem) {
        throw new Error('Failed to seed gear items');
      }

      // Act
      await Promise.all([
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

      const expectedInventoryGearStatus = await findInventoryItemById(inventoryItem.id);

      // Assert
      expect(expectedInventoryGearStatus?.stockQuantity).toBe(totalQuantity - issueQuantity * 2);
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
        payload: { bulk: [], serialized: [{ serialNumber: '   ' }] },
      },
      {
        name: 'serialized serial number exceeds max length',
        payload: { bulk: [], serialized: [{ serialNumber: 'A'.repeat(101) }] },
      },
      {
        name: 'duplicate serialized serial numbers',
        payload: {
          bulk: [],
          serialized: [{ serialNumber: 'SER-001' }, { serialNumber: 'SER-001' }],
        },
      },
      {
        name: 'duplicate serialized serial numbers after trim',
        payload: {
          bulk: [],
          serialized: [{ serialNumber: '  SER-002  ' }, { serialNumber: 'SER-002' }],
        },
      },
    ])('when the request payload has %s then responds 400', async ({ payload }) => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());

      // Act
      const res = await api().post(gearIssueUrl(reservist.id)).send(payload);

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
            .post(gearIssueUrl(reservist.id))
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

    it('when the database fails then no gear is issued and the data remains unchanged', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);
      const helmetCategoryId = categories.get(GEAR_CATEGORIES.HELMET.name);

      if (!shirtCategoryId || !helmetCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const inventoryItems = await createInventoryItems(shirtCategoryId, [...GEAR_SIZES], 5);
      const [serializedItem] = await createSerializedItems(helmetCategoryId, 'STATUS-HELMET', [
        ...GEAR_SIZES,
      ]);
      const mediumInventoryItem = inventoryItems.find((item) => item.size === 'M');

      if (!mediumInventoryItem || !serializedItem) {
        throw new Error('Failed to seed gear items');
      }

      const beforeSerialized = await findSerializedItemBySerialNumber(
        serializedItem.serializedNumber,
      );
      const beforeInventory = await findInventoryItemById(mediumInventoryItem.id);

      // Act
      await withBrokenTable(
        () =>
          api()
            .post(gearIssueUrl(reservist.id))
            .send({
              bulk: [{ inventoryItemId: mediumInventoryItem.id, quantity: 2 }],
              serialized: [{ serialNumber: serializedItem.serializedNumber }],
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
      expect(beforeSerialized?.status).toBe(SERIALIZED_GEAR_DB_STATUSES.AVAILABLE);
      expect(afterSerialized?.status).toBe(beforeSerialized?.status);
      expect(beforeInventory?.stockQuantity).toBe(5);
      expect(afterInventory?.stockQuantity).toBe(beforeInventory?.stockQuantity);
    });

    it('when the database recovers after a failure then the issue succeeds', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);
      const helmetCategoryId = categories.get(GEAR_CATEGORIES.HELMET.name);

      if (!shirtCategoryId || !helmetCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const inventoryItems = await createInventoryItems(shirtCategoryId, [...GEAR_SIZES], 5);
      const [serializedItem] = await createSerializedItems(helmetCategoryId, 'STATUS-HELMET', [
        ...GEAR_SIZES,
      ]);
      const mediumInventoryItem = inventoryItems.find((item) => item.size === 'M');

      if (!mediumInventoryItem || !serializedItem) {
        throw new Error('Failed to seed gear items');
      }

      const failed = await withBrokenTable(
        () =>
          api()
            .post(gearIssueUrl(reservist.id))
            .send({
              bulk: [{ inventoryItemId: mediumInventoryItem.id, quantity: 2 }],
              serialized: [{ serialNumber: serializedItem.serializedNumber }],
            }),
        {
          TABLE_NAME: RESERVIST_GEAR_TABLE_NAME,
          BROKEN_TABLE_NAME: RESERVIST_GEAR_BROKEN_TABLE_NAME,
        },
      );

      // Act
      const recovered = await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: mediumInventoryItem.id, quantity: 2 }],
          serialized: [{ serialNumber: serializedItem.serializedNumber }],
        });

      // Assert
      expect(failed.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(recovered.status).toBe(HTTP_STATUS.OK);
      expect(recovered.body.state).toBe(STATE.SUCCESS);
    });
  });
});
