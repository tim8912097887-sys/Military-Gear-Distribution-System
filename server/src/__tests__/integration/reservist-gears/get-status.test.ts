import { beforeEach, describe, expect, it } from 'vitest';

import { GearReadRepository } from '../../../domains/gears/repository/gear-read.repository.js';
import { api } from '../../utils/reservists/app.js';
import { testDb } from '../../utils/common/db.js';
import { buildCheckedInReservist } from '../../utils/reservists/factory.js';
import { seedReservist, truncateReservists } from '../../utils/reservists/query.js';
import { expectNoInternalDetailsLeaked } from '../../utils/reservist-gears/assertions.js';
import {
  GEAR_CATEGORIES,
  GEAR_SIZES,
  gearIssueUrl,
  gearStatusUrl,
  RESERVIST_GEAR_BROKEN_TABLE_NAME,
  RESERVIST_GEAR_TABLE_NAME,
} from '../../utils/reservist-gears/constants.js';
import {
  createInventoryItems,
  createSerializedItems,
  seedCategories,
  truncateGearStatusData,
} from '../../utils/reservist-gears/query.js';
import { withBrokenTable } from '../../utils/common/seed.js';
import { HTTP_STATUS, STATE } from '../../utils/common/constants.js';
import { INVALID_RESERVIST_IDS } from '../../utils/common/invalid-inputs.js';
import { expectErrorResponse } from '../../utils/common/assertions.js';
import { GearWriteRepository } from '../../../domains/gears/repository/gear-write.repository.js';
import { GearService } from '../../../domains/gears/service/service.js';
import { ReservistRepository } from '../../../domains/reservists/repository/repository.js';

const gearReadRepository = new GearReadRepository(testDb);
const gearWriteRepository = new GearWriteRepository(testDb);
const reservistRepository = new ReservistRepository(testDb);
const gearService = new GearService(gearReadRepository, gearWriteRepository, reservistRepository);

describe('GET /api/v1/reservists/:reservistId/gears', () => {
  beforeEach(async () => {
    await truncateReservists();
    await truncateGearStatusData();
  });

  describe('success', () => {
    it('when the reservist exists then responds 200 with their current gear status', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist({ name: 'Alice Chen' }));
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

      const issue = await api()
        .post(gearIssueUrl(reservist.id))
        .send({
          bulk: [{ inventoryItemId: mediumInventoryItem.id, quantity: 2 }],
          serialized: [{ serialNumber: serializedItem.serializedNumber }],
        });
      const expectedGearStatus = await gearService.getGear(reservist.id);

      // Act
      const res = await api().get(gearStatusUrl(reservist.id));

      // Assert
      expect(issue.status).toBe(HTTP_STATUS.OK);
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.state).toBe(STATE.SUCCESS);
      expect(res.body.data).toEqual(expectedGearStatus);
    });
  });

  describe('validation error', () => {
    it.each(INVALID_RESERVIST_IDS)(
      'when reservistId is %j then responds 400',
      async (invalidId) => {
        // Act
        const res = await api().get(gearStatusUrl(invalidId));

        // Assert
        expectErrorResponse(res, HTTP_STATUS.BAD_REQUEST);
      },
    );
  });

  describe('business logic', () => {
    it('when the reservist is not found then responds 404', async () => {
      // Arrange
      const reservistId = crypto.randomUUID();

      // Act
      const res = await api().get(gearStatusUrl(reservistId));

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
    });
  });

  describe('server error', () => {
    it('when the database fails then responds 500 without leaking internal details', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());

      // Act
      const res = await withBrokenTable(() => api().get(gearStatusUrl(reservist.id)), {
        TABLE_NAME: RESERVIST_GEAR_TABLE_NAME,
        BROKEN_TABLE_NAME: RESERVIST_GEAR_BROKEN_TABLE_NAME,
      });

      // Assert
      expectErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expectNoInternalDetailsLeaked(res);
    });

    it('when the database recovers after a failure then the next request succeeds', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());
      const categories = await seedCategories();
      const shirtCategoryId = categories.get(GEAR_CATEGORIES.SHIRT.name);

      if (!shirtCategoryId) {
        throw new Error('Failed to seed gear categories');
      }

      const inventoryItems = await createInventoryItems(shirtCategoryId, [...GEAR_SIZES]);
      const inventoryItem = inventoryItems.find((item) => item.size === 'M');
      if (!inventoryItem) {
        throw new Error('Failed to seed gear items');
      }

      const issue = await api()
        .post(gearIssueUrl(reservist.id))
        .send({ bulk: [{ inventoryItemId: inventoryItem.id, quantity: 1 }], serialized: [] });
      const expectedGearStatus = await gearService.getGear(reservist.id);
      const failed = await withBrokenTable(() => api().get(gearStatusUrl(reservist.id)), {
        TABLE_NAME: RESERVIST_GEAR_TABLE_NAME,
        BROKEN_TABLE_NAME: RESERVIST_GEAR_BROKEN_TABLE_NAME,
      });

      // Act
      const recovered = await api().get(gearStatusUrl(reservist.id));

      // Assert
      expect(issue.status).toBe(HTTP_STATUS.OK);
      expect(failed.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(recovered.status).toBe(HTTP_STATUS.OK);
      expect(recovered.body.state).toBe(STATE.SUCCESS);
      expect(recovered.body.data).toEqual(expectedGearStatus);
    });
  });
});
