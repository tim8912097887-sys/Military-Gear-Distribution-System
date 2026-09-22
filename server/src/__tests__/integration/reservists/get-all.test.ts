import { beforeEach, describe, expect, it } from 'vitest';

import { api } from '../../utils/reservists/app.js';
import {
  expectErrorResponse,
  expectNoInternalDetailsLeaked,
  //   idsOf,
  //   namesOf,
} from '../../utils/reservists/assertions.js';
import {
  HTTP_STATUS,
  LIST_LIMITS,
  RESERVISTS_URL,
  STATE,
} from '../../utils/reservists/constants.js';
import {
  seedReservist,
  //   countReservists,
  //   seedReservist,
  seedReservists,
  truncateReservists,
  withBrokenReservistsTable,
} from '../../utils/reservists/seed.js';
import {
  buildCheckedInReservist,
  buildCheckedInReservists,
  buildReservist,
  //   buildCheckedInReservist,
  //   buildReservist,
  buildReservists,
  DEFAULT_CHECKED_IN_AT,
  toExpectedView,
  //   DEFAULT_CHECKED_IN_AT,
  //   toExpectedView,
} from '../../utils/reservists/factory.js';
import { INVALID_LIST_QUERIES } from '../../utils/reservists/invalid-inputs.js';

describe('GET /api/v1/reservists', () => {
  beforeEach(async () => {
    await truncateReservists();
  });
  describe('success', () => {
    it('when no reservists exist then responds 200 with an empty list and total 0', async () => {
      // Arrange
      // (database is empty: truncated before every test)

      // Act
      const res = await api().get(RESERVISTS_URL);

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.state).toBe(STATE.SUCCESS);
      expect(res.body.data).toEqual({
        reservists: [],
        pagination: {
          total: 0,
          limit: LIST_LIMITS.defaultLimit,
          offset: LIST_LIMITS.defaultOffset,
        },
      });
    });

    it('when a reservist exists then responds 200 with exactly the reservist view fields', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist({ name: 'Alice Chen' }));

      // Act
      const res = await api().get(RESERVISTS_URL);

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.state).toBe(STATE.SUCCESS);
      expect(res.body.data.reservists).toEqual([toExpectedView(reservist)]);
      expect(res.body.data.pagination.total).toBe(1);
    });

    it('when a reservist has checked in then checkedInAt is an ISO string, otherwise null', async () => {
      // Arrange
      await seedReservist(buildCheckedInReservist({ name: 'Alice' }));
      await seedReservist(buildReservist({ name: 'Bob' }));

      // Act
      const res = await api().get(RESERVISTS_URL);

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.state).toBe(STATE.SUCCESS);
      const [alice, bob] = res.body.data.reservists;
      expect(alice.checkedInAt).toBe(DEFAULT_CHECKED_IN_AT.toISOString());
      expect(bob.checkedInAt).toBeNull();
    });

    it('when offset is beyond the total then responds 200 with an empty page and the real total', async () => {
      // Arrange
      await seedReservists(buildReservists(3));

      // Act
      const res = await api().get(RESERVISTS_URL).query({ offset: 50 });

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.reservists).toEqual([]);
      expect(res.body.data.pagination).toEqual({
        total: 3,
        limit: LIST_LIMITS.defaultLimit,
        offset: 50,
      });
    });

    it('when offset equals the total then responds 200 with an empty page', async () => {
      // Arrange
      await seedReservists(buildReservists(3));

      // Act
      const res = await api().get(RESERVISTS_URL).query({ offset: 3 });

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.reservists).toEqual([]);
      expect(res.body.data.pagination.total).toBe(3);
    });

    it('when checkedIn=true is requested and nobody has checked in then responds 200 with an empty list', async () => {
      // Arrange
      await seedReservists(buildReservists(3));

      // Act
      const res = await api().get(RESERVISTS_URL).query({ checkedIn: 'true' });

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.reservists).toEqual([]);
      expect(res.body.data.pagination.total).toBe(0);
    });

    it('when checkedIn=false is requested and everyone has checked in then responds 200 with an empty list', async () => {
      // Arrange
      await seedReservists(buildCheckedInReservists(3));

      // Act
      const res = await api().get(RESERVISTS_URL).query({ checkedIn: 'false' });

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.reservists).toEqual([]);
      expect(res.body.data.pagination.total).toBe(0);
    });

    it('when checkedIn=true is requested and somebody has checked in then responds 200 with a list that only contains checked-in reservists', async () => {
      // Arrange
      await seedReservists(buildCheckedInReservists(3));
      await seedReservists(buildReservists(5));

      // Act
      const res = await api().get(RESERVISTS_URL).query({ checkedIn: 'true' });

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.reservists.length).toBe(3);
      expect(res.body.data.pagination.total).toBe(3);
    });

    it('when checkedIn=false is requested and somebody has checked in then responds 200 with a list that only contains unchecked-in reservists', async () => {
      // Arrange
      await seedReservists(buildCheckedInReservists(3));
      await seedReservists(buildReservists(5));

      // Act
      const res = await api().get(RESERVISTS_URL).query({ checkedIn: 'false' });

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.reservists.length).toBe(5);
      expect(res.body.data.pagination.total).toBe(5);
    });
  });

  describe('validation error', () => {
    it.each(INVALID_LIST_QUERIES)(
      'when the query string is "%s" then responds 400',
      async (queryString) => {
        // Act
        const res = await api().get(`${RESERVISTS_URL}?${queryString}`);

        // Assert
        expectErrorResponse(res, HTTP_STATUS.BAD_REQUEST);
      },
    );
  });

  describe('server error', () => {
    it('when the database fails then responds 500 without leaking internal details', async () => {
      // Arrange
      await seedReservists(buildReservists(2));

      // Act
      const res = await withBrokenReservistsTable(() => api().get(RESERVISTS_URL));

      // Assert
      expectErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expectNoInternalDetailsLeaked(res);
    });

    it('when the database fails during a filtered search then responds 500', async () => {
      // Arrange
      await seedReservists(buildReservists(2));

      // Act
      const res = await withBrokenReservistsTable(() =>
        api().get(RESERVISTS_URL).query({ q: 'alice', checkedIn: 'true', limit: 5, offset: 1 }),
      );

      // Assert
      expectErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });

    it('when the database recovers after a failure then the next request succeeds', async () => {
      // Arrange
      await seedReservists(buildReservists(2));
      const failed = await withBrokenReservistsTable(() => api().get(RESERVISTS_URL));

      // Act
      const recovered = await api().get(RESERVISTS_URL);

      // Assert
      expect(failed.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(recovered.status).toBe(HTTP_STATUS.OK);
      expect(recovered.body.data.pagination.total).toBe(2);
    });
  });
});
