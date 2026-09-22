import { type ErrorRequestHandler } from 'express';
import { logger } from '../configs/logger/index.js';
import { ERROR_CODE, ERROR_STATUS } from '../utils/response/constants.js';
import { errorResponse } from '../utils/response/error.js';
import { ApiError } from '../applications/error/api.js';
import { DomainError } from '../domains/errors/domain.js';
import { mapDomainErrorToApiError } from './error-mapping.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Variables for data envelope
  let statusCode = ERROR_STATUS.SERVER_ERROR;
  let statusType = ERROR_CODE.SERVER_ERROR;
  let detail = 'An unexpected error occurred. Please try again later.';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    statusType = err.type;
    detail = err.message;
  }

  if (err instanceof DomainError) {
    const apiError = mapDomainErrorToApiError(err);
    if (apiError) {
      statusCode = apiError.statusCode;
      statusType = apiError.type;
      detail = apiError.message;
    }
  }
  // Log useful context
  const logContext = {
    method: req.method,
    path: req.path,
    type: statusType,
    ip: req.ip,
    stack: statusCode === 500 ? err.stack : undefined, // Only log stacks for 500s
  };

  if (statusCode >= 500) {
    logger.error(`[CRITICAL] ${err.message}`, logContext);
  } else {
    logger.warn(`[CLIENT_ERROR] ${detail}`, logContext);
  }

  // Uniform Response Structure
  return res.status(statusCode).json(errorResponse({ code: statusType, detail }));
};
