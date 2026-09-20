import { ApiError } from './api.js';

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(400, message, true);
  }
}
