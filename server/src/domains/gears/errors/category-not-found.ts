import { DomainError } from '../../errors/domain.js';

export class CategoryNotFoundError extends DomainError {
  constructor(categoryId: string) {
    super(`Gear category "${categoryId}" was not found.`);
  }
}
