export class ApiError extends Error {
  public type: string;
  public statusCode: number;
  public isOperational: boolean;

  constructor(errorCode: number, message: string, isOperational = false) {
    super(message);
    this.statusCode = errorCode;
    this.type = this.constructor.name;
    this.isOperational = isOperational;
    // Retain the property and instance name of the ApiError
    Object.setPrototypeOf(this, new.target.prototype);
    // Capture the stack trace, excluding the constructor from the trace
    Error.captureStackTrace(this, this.constructor);
  }
}
