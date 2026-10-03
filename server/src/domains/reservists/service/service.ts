import type { Reservist } from '../../../infrastructure/db/schema/reservists.js';
import { getReservistCacheKey, RESERVIST_CACHE_TTL_SECONDS } from '../constants/cach.js';
import { CheckInConflictError } from '../errors/check-in-conflict.js';
import { ReservistNotFoundError } from '../errors/reservist-not-found.js';
import type { ReservistRepository } from '../repository/repository.js';
import type { ListReservistsServiceInput, ListReservistsResponse, ReservistView } from './dto.js';
import type { CacheClientType } from './types.js';

export class ReservistService {
  constructor(
    private readonly reservistRepository: ReservistRepository,
    private readonly reservistCache: CacheClientType,
  ) {}

  async list(query: ListReservistsServiceInput): Promise<ListReservistsResponse> {
    const {
      rows,
      pagination: { total, nextCursor, hasMore },
    } = await this.reservistRepository.list(query);
    return {
      reservists: rows.map((r) => this.toView(r)),
      pagination: { total, limit: query.limit, nextCursor, hasMore },
    };
  }

  async getById(reservistId: string): Promise<ReservistView> {
    const cached = await this.reservistCache.get(getReservistCacheKey(reservistId));
    if (cached) {
      return JSON.parse(cached) as ReservistView;
    }

    const reservist = await this.reservistRepository.findById(reservistId);
    if (!reservist) {
      throw new ReservistNotFoundError(reservistId);
    }
    // Cache aside the retrieved reservist for future requests
    await this.reservistCache.set(
      getReservistCacheKey(reservistId),
      JSON.stringify(this.toView(reservist)),
      {
        expiration: { type: 'EX', value: RESERVIST_CACHE_TTL_SECONDS },
      },
    );

    return this.toView(reservist);
  }

  async checkIn(reservistId: string): Promise<ReservistView> {
    const reservist = await this.reservistRepository.setCheckedIn(reservistId);

    if (!reservist) {
      const exists = await this.reservistRepository.findById(reservistId);

      if (!exists) {
        throw new ReservistNotFoundError(reservistId);
      }

      throw new CheckInConflictError(reservistId);
    }

    // Cache aside the updated reservist for future requests
    await this.reservistCache.set(
      getReservistCacheKey(reservistId),
      JSON.stringify(this.toView(reservist)),
      {
        expiration: { type: 'EX', value: RESERVIST_CACHE_TTL_SECONDS },
      },
    );

    return this.toView(reservist);
  }

  private toView(r: Reservist): ReservistView {
    return {
      id: r.id,
      nationalId: r.nationalId,
      name: r.name,
      militaryRank: r.militaryRank,
      checkedInAt: r.checkedInAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
