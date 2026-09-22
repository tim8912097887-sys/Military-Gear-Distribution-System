import { ReservistNotFoundError } from '../../reservists/errors/reservist-not-found.js';
import type { ReservistRepository } from '../../reservists/repository/repository.js';
import type { GearRepository } from '../repository/repository.js';
import type { GetGearInput, IssueGearInput, ReturnGearInput } from './dto.js';

export class GearService {
  constructor(
    private readonly gearRepository: GearRepository,
    private readonly reservistRepository: ReservistRepository,
  ) {}

  // =====================================================================
  // Reads
  // =====================================================================

  async getGear(reservistId: string, query: GetGearInput) {
    const reservist = await this.reservistRepository.findById(reservistId);
    if (!reservist) {
      throw new ReservistNotFoundError(reservistId);
    }

    const [bulk, serialized] = await Promise.all([
      this.gearRepository.listHeldBulk(reservistId),
      this.gearRepository.listHeldSerialized(reservistId),
    ]);

    const result: Record<string, unknown> = {
      reservistId,
      checkedInAt: reservist.checkedInAt?.toISOString() ?? null,
      holdings: {
        bulk: bulk.map((b) => ({
          inventoryItemId: b.inventoryItemId,
          categoryId: b.categoryId,
          categoryName: b.categoryName,
          size: b.size,
          quantity: b.quantity,
          issuedAt: b.issuedAt.toISOString(),
        })),
        serialized: serialized.map((s) => ({
          custodyId: s.custodyId,
          serializedItemId: s.serializedItemId,
          serialNumber: s.serialNumber,
          categoryId: s.categoryId,
          categoryName: s.categoryName,
          size: s.size,
          issuedAt: s.issuedAt.toISOString(),
        })),
      },
    };

    if (query.include.has('allowance')) {
      const categories = await this.gearRepository.listCategories();
      const held = new Map<string, number>();
      for (const b of bulk) held.set(b.categoryId, (held.get(b.categoryId) ?? 0) + b.quantity);
      for (const s of serialized) held.set(s.categoryId, (held.get(s.categoryId) ?? 0) + 1);

      result.allowance = categories.map((c) => {
        const current = held.get(c.id) ?? 0;
        return {
          categoryId: c.id,
          categoryName: c.name,
          trackingType: c.trackingType,
          limit: c.maxPerReservist,
          held: current,
          remaining: Math.max(0, c.maxPerReservist - current),
        };
      });
    }

    if (query.include.has('history')) {
      const history = await this.gearRepository.listHistory(reservistId, query.historyLimit);
      result.history = history.map((h) => ({
        id: h.id,
        actionType: h.actionType,
        categoryName: h.categoryName,
        size: h.size,
        serialNumber: h.serialNumber,
        quantity: h.quantity,
        createdAt: h.createdAt.toISOString(),
      }));
    }

    return result;
  }

  // =====================================================================
  // Issue
  // =====================================================================

  async issue(reservistId: string, body: IssueGearInput) {
    const data = await this.gearRepository.issueGear(reservistId, body);
    if (!data) {
      throw new ReservistNotFoundError(reservistId);
    }
    return { data };
  }

  async returnGear(reservistId: string, body: ReturnGearInput) {
    const data = await this.gearRepository.returnGear(reservistId, body);
    if (!data) {
      throw new ReservistNotFoundError(reservistId);
    }
    return { data };
  }
}
