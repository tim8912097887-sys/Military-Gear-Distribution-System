import { DomainError } from '../../errors/domain.js';

export class CustodyCreationError extends DomainError {
  constructor(serialNumber: string) {
    super(`Failed to assign custody for serial number "${serialNumber}".`);
  }
}
