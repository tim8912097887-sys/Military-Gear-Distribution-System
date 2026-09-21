import { DomainError } from '../../errors/domain.js';

export class InsufficientHoldingError extends DomainError {
  constructor(itemId: string) {
    super(`Cannot return more gear than the reservist holds for inventory item "${itemId}".`);
  }
}
