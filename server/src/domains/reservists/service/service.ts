import type { Reservist } from '../../../infrastructure/db/schema/reservists.js';
import { CheckInConflictError } from '../errors/check-in-conflict.js';
import { ReservistNotFoundError } from '../errors/reservist-not-found.js';
import type { ReservistRepository } from '../repository/repository.js';
import type { ListReservistsServiceInput, ListReservistsResponse, ReservistView } from './dto.js';

export class ReservistService {
  constructor(private readonly reservistRepository: ReservistRepository) {}

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
    const reservist = await this.reservistRepository.findById(reservistId);
    if (!reservist) {
      throw new ReservistNotFoundError(reservistId);
    }
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
