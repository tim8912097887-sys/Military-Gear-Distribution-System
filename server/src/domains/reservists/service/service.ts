import type { Reservist } from '../../../infrastructure/db/schema/reservists.js';
import { CheckInConflictError } from '../errors/check-in-conflict.js';
import { ReservistNotFoundError } from '../errors/reservist-not-found.js';
import type { ListReservistsQuery } from '../repository/dto.js';
import type { ReservistRepository } from '../repository/repository.js';
import type { ListReservistsResponse, ReservistView } from './dto.js';

export class ReservistService {
  constructor(private readonly reservistRepository: ReservistRepository) {}

  async list(query: ListReservistsQuery): Promise<ListReservistsResponse> {
    const { rows, total } = await this.reservistRepository.list(query);
    return {
      reservists: rows.map((r) => this.toView(r)),
      pagination: { total, limit: query.limit, offset: query.offset },
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
    const existingReservist = await this.reservistRepository.findById(reservistId);
    if (!existingReservist) {
      throw new ReservistNotFoundError(reservistId);
    }
    if (existingReservist.checkedInAt) {
      throw new CheckInConflictError(reservistId);
    }
    const checkedInReservist = await this.reservistRepository.setCheckedIn(reservistId);
    if (!checkedInReservist) {
      throw new CheckInConflictError(reservistId);
    }
    return this.toView(checkedInReservist);
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
