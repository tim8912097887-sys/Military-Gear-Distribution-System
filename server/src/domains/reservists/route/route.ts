import { Router } from 'express';
import type { ReservistController } from '../controller/controller.js';

export function createReservistRouter(controller: ReservistController): Router {
  const router = Router();

  router.get('/', controller.list);
  router.get('/:reservistId', controller.getById);
  router.post('/:reservistId/check-in', controller.checkIn);

  return router;
}
