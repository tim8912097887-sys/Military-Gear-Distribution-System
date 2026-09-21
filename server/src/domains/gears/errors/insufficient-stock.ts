import { DomainError } from '../../errors/domain.js';

export class InsufficientStockError extends DomainError {
  constructor(itemId: string) {
    super(`Insufficient stock for inventory item "${itemId}".`);
  }
}
