import { type RequestHandler } from 'express';
import { logger } from '../configs/logger/index.js';
import { ERROR_CODE, ERROR_STATUS } from '../utils/response/constants.js';
import { errorResponse } from '../utils/response/error.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  logger.warn(`NotFoundHandler: Ip ${req.ip} enter not found route ${req.method} ${req.url}`);

  res
    .status(ERROR_STATUS.NOT_FOUND)
    .json(errorResponse({ code: ERROR_CODE.NOT_FOUND, detail: 'Route not found' }));
};
