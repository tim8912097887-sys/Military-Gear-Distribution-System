import { DomainError } from '../../errors/domain.js';

export class InventoryItemLostError extends DomainError {
  constructor() {
    super('Inventory item is lost.');
  }
}
