import type { ApiError } from '../applications/error/api.js';
import { NotFoundError } from '../applications/error/not-found.js';
import { ServerConflictError } from '../applications/error/server-conflict.js';
import type { DomainError } from '../domains/errors/domain.js';
import { AllowanceExceededError } from '../domains/gears/errors/allowance-exceeded.js';
import { CategoryNotFoundError } from '../domains/gears/errors/category-not-found.js';
import { CustodyCreationError } from '../domains/gears/errors/custody-creation.js';
import { InsufficientHoldingError } from '../domains/gears/errors/insufficient-holding.js';
import { InsufficientStockError } from '../domains/gears/errors/insufficient-stock.js';
import { InventoryItemNotFoundError } from '../domains/gears/errors/inventory-item-not-found.js';
import { SerializedItemNotFoundError } from '../domains/gears/errors/serialized-item-not-found.js';
import { CheckInConflictError } from '../domains/reservists/errors/check-in-conflict.js';
import { ReservistNotFoundError } from '../domains/reservists/errors/reservist-not-found.js';

export const mapDomainErrorToApiError = (error: DomainError): ApiError | undefined => {
  if (error instanceof ReservistNotFoundError) {
    return new NotFoundError(error.message);
  } else if (error instanceof AllowanceExceededError) {
    return new ServerConflictError(error.message);
  } else if (error instanceof InventoryItemNotFoundError) {
    return new NotFoundError(error.message);
  } else if (error instanceof CategoryNotFoundError) {
    return new NotFoundError(error.message);
  } else if (error instanceof CustodyCreationError) {
    return new ServerConflictError(error.message);
  } else if (error instanceof InsufficientStockError) {
    return new ServerConflictError(error.message);
  } else if (error instanceof SerializedItemNotFoundError) {
    return new NotFoundError(error.message);
  } else if (error instanceof InsufficientHoldingError) {
    return new ServerConflictError(error.message);
  } else if (error instanceof CheckInConflictError) {
    return new ServerConflictError(error.message);
  } else {
    return;
  }
};
