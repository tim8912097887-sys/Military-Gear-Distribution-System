import { ApiError } from './api.js';

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message, true);
  }
}
