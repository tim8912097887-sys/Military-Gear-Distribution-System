import { type CorsOptions } from 'cors';
import { type Request } from 'express';
import { env } from '../env/index.js';

export const corsConfig = (req: Request, callback: any) => {
  const corsOptions: Partial<CorsOptions> = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  corsOptions.origin = env.CORS_ORIGIN;
  callback(null, corsOptions);
};
