import type { GearCategory } from '../../../infrastructure/db/schema/gear-categories.js';
import type { Reservist } from '../../../infrastructure/db/schema/reservists.js';
import { ReservistNotFoundError } from '../../reservists/errors/reservist-not-found.js';
import type { ReservistRepository } from '../../reservists/repository/repository.js';
import type { GearReadRepository } from '../repository/gear-read.repository.js';
import type { GearWriteRepository } from '../repository/gear-write.repository.js';
import type {
  GearAllowanceView,
  GearAvailabilityResponse,
  GetGearHistoryInput,
  GearStatusResponse,
  HeldBulkView,
  HeldSerializedView,
  IssueGearInput,
  ReturnGearInput,
} from './dto.js';

export class GearService {
  constructor(
    private readonly gearReadRepository: GearReadRepository,
    private readonly gearWriteRepository: GearWriteRepository,
    private readonly reservistRepository: ReservistRepository,
  ) {}

  async getGear(reservistId: string): Promise<GearStatusResponse> {
    const reservist = await this.reservistRepository.findById(reservistId);
    if (!reservist) {
      throw new ReservistNotFoundError(reservistId);
    }

    const result = await this.reservistGearInfo(reservist);

    return result;
  }

  async issue(reservistId: string, body: IssueGearInput): Promise<GearStatusResponse> {
    const reservist = await this.gearWriteRepository.issueGear(reservistId, body);
    if (!reservist) {
      throw new ReservistNotFoundError(reservistId);
    }

    const updatedGear = await this.reservistGearInfo(reservist);
    return updatedGear;
  }

  async returnGear(reservistId: string, body: ReturnGearInput): Promise<GearStatusResponse> {
    const reservist = await this.gearWriteRepository.returnGear(reservistId, body);
    if (!reservist) {
      throw new ReservistNotFoundError(reservistId);
    }

    const updatedGear = await this.reservistGearInfo(reservist);
    return updatedGear;
  }

  async getGearHistory(reservistId: string, { offset, limit }: GetGearHistoryInput) {
    const reservist = await this.reservistRepository.findById(reservistId);
    if (!reservist) {
      throw new ReservistNotFoundError(reservistId);
    }
    const result = await this.gearReadRepository.listHistory(reservistId, limit, offset);

    const response = {
      ...result,
      history: result.history.map((h) => ({
        ...h,
        createdAt: h.createdAt.toISOString(),
      })),
    };

    return response;
  }

  private async reservistGearInfo(reservist: Reservist) {
    const [bulk, serialized] = await Promise.all([
      this.gearReadRepository.listHeldBulk(reservist.id),
      this.gearReadRepository.listHeldSerialized(reservist.id),
    ]);

    const normalizeBulk = bulk.map((b) => ({
      inventoryItemId: b.inventoryItemId,
      categoryId: b.categoryId,
      categoryName: b.categoryName,
      size: b.size,
      quantity: b.quantity,
      issuedAt: b.issuedAt.toISOString(),
    }));

    const normalizeSerialized = serialized.map((s) => ({
      custodyId: s.custodyId,
      serializedItemId: s.serializedItemId,
      serialNumber: s.serialNumber,
      categoryId: s.categoryId,
      categoryName: s.categoryName,
      size: s.size,
      issuedAt: s.issuedAt.toISOString(),
    }));

    // Use for allowance and availability
    const categories = await this.gearReadRepository.listCategories();
    const allowance = this.buildAllowance(categories, normalizeBulk, normalizeSerialized);
    const available = await this.buildAvailability(allowance);

    const result: GearStatusResponse = {
      reservist: {
        id: reservist.id,
        name: reservist.name,
        militaryRank: reservist.militaryRank,
        checkedInAt: reservist.checkedInAt ? reservist.checkedInAt.toISOString() : null,
      },
      holdings: {
        bulk: normalizeBulk,
        serialized: normalizeSerialized,
      },
      allowance,
      availability: available,
    };

    return result;
  }

  private buildAllowance(
    categories: GearCategory[],
    bulk: HeldBulkView[],
    serialized: HeldSerializedView[],
  ): GearAllowanceView[] {
    const held = new Map<string, number>();

    for (const item of bulk) {
      held.set(item.categoryId, (held.get(item.categoryId) ?? 0) + item.quantity);
    }

    for (const item of serialized) {
      held.set(item.categoryId, (held.get(item.categoryId) ?? 0) + 1);
    }

    return categories.map((category) => {
      const current = held.get(category.id) ?? 0;

      return {
        categoryId: category.id,
        categoryName: category.name,
        trackingType: category.trackingType,
        limit: category.maxPerReservist,
        held: current,
        remaining: Math.max(0, category.maxPerReservist - current),
      };
    });
  }

  private async buildAvailability(
    allowance: GearAllowanceView[],
  ): Promise<GearAvailabilityResponse[]> {
    const availableItems = await this.gearReadRepository.listAvailableStock();

    return allowance.flatMap((category) => {
      if (category.remaining === 0) {
        return [];
      }

      const available = availableItems.filter((item) => item.categoryId === category.categoryId);

      if (available.length === 0) {
        return [];
      }

      return [
        {
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          trackingType: category.trackingType,
          remainingAllowance: category.remaining,
          sizes: available.map((item) => {
            if ('inventoryItemId' in item) {
              return {
                inventoryItemId: item.inventoryItemId,
                size: item.size,
                availableQuantity: Math.min(item.availableQuantity, category.remaining),
              };
            }

            return {
              serializedItemId: item.serializedItemId,
              serialNumber: item.serialNumber,
              size: item.size,
              availableQuantity: 1 as const,
            };
          }),
        },
      ];
    });
  }
}
