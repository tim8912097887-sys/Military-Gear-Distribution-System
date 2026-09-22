import { Router } from 'express';
import type { GearController } from '../controller/controller.js';

export function createGearRouter(controller: GearController): Router {
  const router = Router({ mergeParams: true });

  router.get('/reservists/:reservistId', controller.getGearForReservist);
  router.post('/reservists/:reservistId/gear-issues', controller.issue);
  router.post('/reservists/:reservistId/gear-returns', controller.returnGear);

  return router;
}
