import { beforeEach, describe, expect, it } from 'vitest';

import { api } from '../../utils/reservists/app.js';
import {
  expectErrorResponse,
  expectIsoTimestampBetween,
  expectNoInternalDetailsLeaked,
  namesOf,
} from '../../utils/reservists/assertions.js';
import {
  checkInUrl,
  HTTP_STATUS,
  reservistUrl,
  RESERVISTS_URL,
} from '../../utils/reservists/constants.js';
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
  toExpectedView,
  unknownReservistId,
} from '../../utils/reservists/factory.js';
import { INVALID_RESERVIST_IDS } from '../../utils/reservists/invalid-inputs.js';

describe('POST /api/v1/reservists/:reservistId/check-in', () => {
  beforeEach(async () => {
    await truncateReservists();
  });
  describe('success', () => {
    it('when the reservist has not checked in then responds 200 with checkedInAt set to now', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist({ name: 'Alice' }));
      const before = Date.now();

      // Act
      const res = await api().post(checkInUrl(reservist.id));
      const after = Date.now();

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data).toEqual({
        ...toExpectedView(reservist),
        checkedInAt: expect.any(String),
      });
      expectIsoTimestampBetween(res.body.data.checkedInAt, before, after);
    });

    it('when the check-in succeeds then persists checkedInAt in the database', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist());

      // Act
      const res = await api().post(checkInUrl(reservist.id));
      const row = await findReservistRow(reservist.id);

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(row?.checkedInAt).toBeInstanceOf(Date);
      expect(row?.checkedInAt?.toISOString()).toBe(res.body.data.checkedInAt);
    });

    it('when the check-in succeeds then changes no other field of the reservist', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist());

      // Act
      await api().post(checkInUrl(reservist.id));
      const row = await findReservistRow(reservist.id);

      // Assert
      expect(row).toEqual({ ...reservist, checkedInAt: expect.any(Date) });
    });

    it('when the check-in succeeds then other reservists are left untouched', async () => {
      // Arrange
      const target = await seedReservist(buildReservist({ name: 'Target' }));
      const bystander = await seedReservist(buildReservist({ name: 'Bystander' }));
      const alreadyIn = await seedReservist(buildCheckedInReservist({ name: 'Already In' }));

      // Act
      await api().post(checkInUrl(target.id));

      // Assert
      expect(await findReservistRow(bystander.id)).toEqual(bystander);
      expect(await findReservistRow(alreadyIn.id)).toEqual(alreadyIn);
    });

    it('when the request carries a body then ignores it and uses the server time', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist());
      const before = Date.now();

      // Act
      const res = await api()
        .post(checkInUrl(reservist.id))
        .send({ checkedInAt: '2000-01-01T00:00:00.000Z', name: 'Hacker' });
      const after = Date.now();

      // Assert
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.name).toBe(reservist.name);
      expectIsoTimestampBetween(res.body.data.checkedInAt, before, after);
    });

    it('when the check-in succeeds then GET by id returns the same checkedInAt', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist());

      // Act
      const checkIn = await api().post(checkInUrl(reservist.id));
      const fetched = await api().get(reservistUrl(reservist.id));

      // Assert
      expect(fetched.status).toBe(HTTP_STATUS.OK);
      expect(fetched.body.data).toEqual(checkIn.body.data);
    });

    it('when the check-in succeeds then the reservist appears in the checkedIn=true list only', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist({ name: 'Alice' }));
      await seedReservist(buildReservist({ name: 'Bob' }));

      // Act
      await api().post(checkInUrl(reservist.id));
      const checkedIn = await api().get(RESERVISTS_URL).query({ checkedIn: 'true' });
      const pending = await api().get(RESERVISTS_URL).query({ checkedIn: 'false' });

      // Assert
      expect(namesOf(checkedIn)).toEqual(['Alice']);
      expect(namesOf(pending)).toEqual(['Bob']);
    });
  });

  describe('validation error', () => {
    it.each(INVALID_RESERVIST_IDS)(
      'when reservistId is %j then responds 400',
      async (invalidId) => {
        // Arrange
        await seedReservists(buildReservists(2));

        // Act
        const res = await api().post(checkInUrl(invalidId));

        // Assert
        expectErrorResponse(res, HTTP_STATUS.BAD_REQUEST);
      },
    );

    it('when reservistId is invalid then nobody gets checked in', async () => {
      // Arrange
      const reservists = await seedReservists(buildReservists(3));

      // Act
      await api().post(checkInUrl('not-a-uuid'));

      // Assert
      for (const reservist of reservists) {
        expect(await findReservistRow(reservist.id)).toEqual(reservist);
      }
    });
  });

  describe('business logic error', () => {
    it('when no reservist has the given id then responds 404 and creates nothing', async () => {
      // Arrange
      const before = await countReservists();

      // Act
      const res = await api().post(checkInUrl(unknownReservistId()));

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
      expect(await countReservists()).toBe(before);
    });

    it('when other reservists exist but not the requested one then responds 404 and checks nobody in', async () => {
      // Arrange
      const reservists = await seedReservists(buildReservists(3));

      // Act
      const res = await api().post(checkInUrl(unknownReservistId()));

      // Assert
      expectErrorResponse(res, HTTP_STATUS.NOT_FOUND);
      for (const reservist of reservists) {
        expect(await findReservistRow(reservist.id)).toEqual(reservist);
      }
    });

    it('when the reservist has already checked in then responds 409 and keeps the original timestamp', async () => {
      // Arrange
      const reservist = await seedReservist(buildCheckedInReservist());

      // Act
      const res = await api().post(checkInUrl(reservist.id));
      const row = await findReservistRow(reservist.id);

      // Assert
      expectErrorResponse(res, HTTP_STATUS.CONFLICT);
      expect(row?.checkedInAt?.toISOString()).toBe(DEFAULT_CHECKED_IN_AT.toISOString());
    });

    it('when the same reservist checks in twice then the first succeeds, the second responds 409 and the first timestamp is kept', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist());

      // Act
      const first = await api().post(checkInUrl(reservist.id));
      const second = await api().post(checkInUrl(reservist.id));
      const row = await findReservistRow(reservist.id);

      // Assert
      expect(first.status).toBe(HTTP_STATUS.OK);
      expectErrorResponse(second, HTTP_STATUS.CONFLICT);
      expect(row?.checkedInAt?.toISOString()).toBe(first.body.data.checkedInAt);
    });

    it('when several check-ins race for the same reservist then exactly one succeeds and the rest respond 409', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist());
      const attempts = 5;

      // Act
      const responses = await Promise.all(
        Array.from({ length: attempts }, () => api().post(checkInUrl(reservist.id))),
      );
      const row = await findReservistRow(reservist.id);

      // Assert
      const statuses = responses.map((r) => r.status).sort();
      expect(statuses).toEqual([
        HTTP_STATUS.OK,
        ...Array.from({ length: attempts - 1 }, () => HTTP_STATUS.CONFLICT),
      ]);
      const winner = responses.find((r) => r.status === HTTP_STATUS.OK);
      expect(row?.checkedInAt?.toISOString()).toBe(winner?.body.data.checkedInAt);
    });

    it('when different reservists check in concurrently then all of them succeed', async () => {
      // Arrange
      const reservists = await seedReservists(buildReservists(4));

      // Act
      const responses = await Promise.all(reservists.map((r) => api().post(checkInUrl(r.id))));

      // Assert
      expect(responses.map((r) => r.status)).toEqual(reservists.map(() => HTTP_STATUS.OK));
      for (const reservist of reservists) {
        expect((await findReservistRow(reservist.id))?.checkedInAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('server error', () => {
    it('when the database fails then responds 500 without leaking internal details', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist());

      // Act
      const res = await withBrokenReservistsTable(() => api().post(checkInUrl(reservist.id)));

      // Assert
      expectErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expectNoInternalDetailsLeaked(res);
    });

    it('when the database fails then the reservist is still not checked in once the database is back', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist());

      // Act
      await withBrokenReservistsTable(() => api().post(checkInUrl(reservist.id)));
      const row = await findReservistRow(reservist.id);

      // Assert
      expect(row).toEqual(reservist);
    });

    it('when the database recovers after a failure then the check-in succeeds', async () => {
      // Arrange
      const reservist = await seedReservist(buildReservist());
      const failed = await withBrokenReservistsTable(() => api().post(checkInUrl(reservist.id)));

      // Act
      const recovered = await api().post(checkInUrl(reservist.id));

      // Assert
      expect(failed.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(recovered.status).toBe(HTTP_STATUS.OK);
      expect(recovered.body.data.checkedInAt).not.toBeNull();
    });
  });
});
