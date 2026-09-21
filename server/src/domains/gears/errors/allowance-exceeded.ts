import { DomainError } from '../../errors/domain.js';

export class AllowanceExceededError extends DomainError {
  constructor(categoryName: string, maxLimit: number) {
    super(`Cannot issue gear: Limit of ${maxLimit} for "${categoryName}" would be exceeded.`);
  }
}
