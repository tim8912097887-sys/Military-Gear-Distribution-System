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
          nextCursor: LIST_LIMITS.defaultCursor,
          hasMore: false,
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
      expect(res.body.data.pagination.hasMore).toBe(false);
      expect(res.body.data.pagination.nextCursor).toBeNull();
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
      const [first, second] = res.body.data.reservists;
      const alice = first.checkedInAt ? first : second;
      const bob = first.checkedInAt ? second : first;
      expect(alice.checkedInAt).toBe(DEFAULT_CHECKED_IN_AT.toISOString());
      expect(bob.checkedInAt).toBeNull();
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
      expect(res.body.data.pagination.hasMore).toBe(false);
      expect(res.body.data.pagination.nextCursor).toBeNull();
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
      expect(res.body.data.pagination.hasMore).toBe(false);
      expect(res.body.data.pagination.nextCursor).toBeNull();
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

    it('when cursor is null and limit is less than the number of reservists then responds 200 with the limit number of reservists and id of the next cursor', async () => {
      // Arrange
      await seedReservists(buildReservists(3));

      // Act
      const res = await api().get(RESERVISTS_URL).query({ limit: '2' });

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.reservists.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(3);
      expect(res.body.data.pagination.nextCursor).toBe(res.body.data.reservists[1].id);
      expect(res.body.data.pagination.hasMore).toBe(true);
    });

    it('when cursor is not null and limit is less than the number of reservists then responds 200 with the limit number of reservists and id of the next cursor', async () => {
      // Arrange
      const total = 9;
      const limit = 2;
      const seededReservists = await seedReservists(buildReservists(total));
      const sortedReservists = seededReservists.sort((a, b) => (a.id > b.id ? 1 : -1));
      // Act
      const res = await api()
        .get(RESERVISTS_URL)
        .query({ cursor: sortedReservists[1].id, limit: '2' });

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.reservists.length).toBe(limit);
      expect(res.body.data.pagination.total).toBe(total - limit);
      expect(res.body.data.pagination.nextCursor).toBe(res.body.data.reservists[1].id);
      expect(res.body.data.pagination.hasMore).toBe(true);
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
      expect(recovered.body.data.pagination.hasMore).toBe(false);
      expect(recovered.body.data.pagination.nextCursor).toBeNull();
    });
  });
});
