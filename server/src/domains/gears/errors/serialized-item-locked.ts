import { DomainError } from '../../errors/domain.js';

export class SerializedItemLockedError extends DomainError {
  constructor(identifier: string) {
    super(`Serialized item ${identifier} is currently locked by another transaction.`);
  }
}
