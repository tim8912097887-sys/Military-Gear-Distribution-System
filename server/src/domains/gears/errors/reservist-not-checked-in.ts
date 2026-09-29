import { DomainError } from '../../errors/domain.js';

export class ReservistNotCheckedInError extends DomainError {
  constructor(reservistId: string) {
    super(`Reservist with ID ${reservistId} was not checked in.`);
  }
}
