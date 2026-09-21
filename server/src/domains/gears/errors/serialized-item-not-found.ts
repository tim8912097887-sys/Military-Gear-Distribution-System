import { DomainError } from '../../errors/domain.js';

export class SerializedItemNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Serialized item "${identifier}" was not found or is unavailable.`);
  }
}
