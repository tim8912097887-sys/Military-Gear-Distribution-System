import { DomainError } from '../../errors/domain.js';

export class ReservistLockedError extends DomainError {
  constructor(reservistId: string) {
    super(`Reservist ${reservistId} is currently being processed by another transaction.`);
  }
}
