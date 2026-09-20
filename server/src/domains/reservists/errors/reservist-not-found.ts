import { DomainError } from '../../errors/domain.js';

export class ReservistNotFoundError extends DomainError {
  constructor(reservistId: string) {
    super(`Reservist with ID ${reservistId} was not found.`);
  }
}
