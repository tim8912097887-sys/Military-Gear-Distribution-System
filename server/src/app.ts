import express, { Router } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { corsConfig } from './configs/cors/index.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFoundHandler } from './middlewares/notfound-handler.js';
import { SUCCESS_STATUS } from './utils/response/constants.js';
import { successResponse } from './utils/response/success.js';
import { reservistRouter } from './domains/reservists/container/container.js';

export const initializeApp = (): express.Application => {
  const app = express();
  // Config cors
  app.use(cors(corsConfig));

  // Body parser middleware
  app.use(express.json());

  // HTTP request logger middleware
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms')); // Log to console

  // Healthy check endpoint
  app.get('/health', (_req, res) => {
    res.status(SUCCESS_STATUS).json(
      successResponse({
        message: 'Server Healthy',
      }),
    );
  });

  // Routes
  const v1Router = Router();
  v1Router.use('/reservists', reservistRouter);
  app.use('/api/v1', v1Router);

  // Error Handler
  app.use(errorHandler);
  app.use(notFoundHandler);
  return app;
};
