import { DomainError } from '../../errors/domain.js';

export class InventoryItemNotFoundError extends DomainError {
  constructor(itemId: string) {
    super(`Inventory item "${itemId}" was not found.`);
  }
}
