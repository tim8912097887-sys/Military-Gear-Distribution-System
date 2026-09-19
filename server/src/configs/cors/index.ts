import { type CorsOptions } from 'cors';
import { type Request } from 'express';

const allowedOrigins = ['http://localhost:5173'];
export const corsConfig = (req: Request, callback: any) => {
  const corsOptions: Partial<CorsOptions> = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  corsOptions.origin = allowedOrigins;
  callback(null, corsOptions);
};
