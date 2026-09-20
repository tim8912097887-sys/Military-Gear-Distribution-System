import { ApiError } from './api.js';

export class ServerConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, true);
  }
}
