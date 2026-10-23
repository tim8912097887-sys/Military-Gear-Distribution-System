import type { InventoryRepository } from '../repository/inventory.repository.js';
import type { InventoryAdjustmentInput, InventoryItemView } from './dto.js';

export class InventoryService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async list(): Promise<InventoryItemView[]> {
    return this.inventoryRepository.listBulkItems();
  }

  async adjust(input: InventoryAdjustmentInput): Promise<InventoryItemView[]> {
    // All validation, locking, stock checks, updates, and logging happen atomically inside the transaction repository method
    await this.inventoryRepository.adjustStockAndLog(input.adjustments);
    return this.list();
  }
}
