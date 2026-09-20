import { DomainError } from '../../errors/domain.js';

export class CheckInConflictError extends DomainError {
  constructor(reservistId: string) {
    super(`Reservist ${reservistId} is already checked in`);
  }
}
