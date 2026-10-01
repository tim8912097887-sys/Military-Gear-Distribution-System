import { DomainError } from '../../errors/domain.js';

export class InventoryLockTimeoutError extends DomainError {
  constructor() {
    super(
      'The requested inventory item is currently locked by another transaction. Please try again.',
    );
  }
}
