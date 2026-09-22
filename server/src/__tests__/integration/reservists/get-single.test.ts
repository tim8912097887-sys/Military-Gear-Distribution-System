import { beforeEach, describe, expect, it } from 'vitest';

import { api } from '../../utils/reservists/app.js';
import {
  expectErrorResponse,
  expectNoInternalDetailsLeaked,
} from '../../utils/reservists/assertions.js';
import { HTTP_STATUS, reservistUrl, STATE } from '../../utils/reservists/constants.js';
import {
  countReservists,
  findReservistRow,
  seedReservist,
  seedReservists,
  truncateReservists,
  withBrokenReservistsTable,
} from '../../utils/reservists/seed.js';
import {
  buildCheckedInReservist,
  buildReservist,
  buildReservists,
  DEFAULT_CHECKED_IN_AT,
  DEFAULT_CREATED_AT,
  toExpectedView,
  unknownReservistId,
} from '../../utils/reservists/factory.js';
import { INVALID_RESERVIST_IDS } from '../../utils/reservists/invalid-inputs.js';

describe('GET /api/v1/reservists/:reservistId', () => {
  beforeEach(async () => {
    await truncateReservists();
  });
  describe('success', () => {
    it('when the reservist exists then responds 200 with exactly the reservist view fields', async () => {
      // Arrange
      const reservist = await seedReservist(
        buildReservist({ name: 'Alice Chen', nationalId: 'A123456789', militaryRank: 'Sergeant' }),
      );

      // Act
      const res = await api().get(reservistUrl(reservist.id));

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.state).toBe(STATE.SUCCESS);
      expect(res.body.data).toEqual({
        id: reservist.id,
        nationalId: 'A123456789',
        name: 'Alice Chen',
        militaryRank: 'Sergeant',
        checkedInAt: null,
        createdAt: DEFAULT_CREATED_AT.toISOString(),
      });
    });

    it('when the reservist has checked in then checkedInAt is returned as an ISO string', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());

      // Act
      const res = await api().get(reservistUrl(reservist.id));

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.state).toBe(STATE.SUCCESS);
      expect(res.body.data.checkedInAt).toBe(DEFAULT_CHECKED_IN_AT.toISOString());
    });

    it('when many reservists exist then returns only the requested one', async () => {
      // Arrange
      await seedReservists(buildReservists(5));
      const target = await seedReservist(buildReservist({ name: 'Target' }));
      await seedReservists(buildReservists(5));

      // Act
      const res = await api().get(reservistUrl(target.id));

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.state).toBe(STATE.SUCCESS);
      expect(res.body.data).toEqual(toExpectedView(target));
    });

    it('when requested repeatedly then returns the same data and does not modify the reservist', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist());

      // Act
      const first = await api().get(reservistUrl(reservist.id));
      const second = await api().get(reservistUrl(reservist.id));
      const rowAfter = await findReservistRow(reservist.id);

      // Assert
      expect(second.body.data).toEqual(first.body.data);
      expect(rowAfter).toEqual(reservist);
    });
  });

  describe('validation error', () => {
    it.each(INVALID_RESERVIST_IDS)(
      'when reservistId is %j then responds 400',
      async (invalidId) => {
        // Arrange
        await seedReservists(buildReservists(2));

        // Act
        const res = await api().get(reservistUrl(invalidId));

        // Assert
        expectErrorResponse(res, HTTP_STATUS.BAD_REQUEST);
      },
    );
  });

  describe('business logic error', () => {
    it('when no reservist has the given id then responds 404', async () => {
      // Arrange
      const missingId = unknownReservistId();

      // Act
      const res = await api().get(reservistUrl(missingId));

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
    });

    it('when other reservists exist but not the requested one then responds 404', async () => {
      // Arrange
      await seedReservists(buildReservists(3));

      // Act
      const res = await api().get(reservistUrl(unknownReservistId()));

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
      expect(await countReservists()).toBe(3);
    });
  });

  describe('server error', () => {
    it('when the database fails then responds 500 without leaking internal details', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist());

      // Act
      const res = await withBrokenReservistsTable(() => api().get(reservistUrl(reservist.id)));

      // Assert
      expectErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expectNoInternalDetailsLeaked(res);
    });

    it('when the database recovers after a failure then the next request succeeds', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist());
      const failed = await withBrokenReservistsTable(() => api().get(reservistUrl(reservist.id)));

      // Act
      const recovered = await api().get(reservistUrl(reservist.id));

      // Assert
      expect(failed.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(recovered.status).toBe(HTTP_STATUS.OK);
      expect(recovered.body.data).toEqual(toExpectedView(reservist));
    });
  });
});
