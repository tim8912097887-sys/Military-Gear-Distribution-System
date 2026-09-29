import { Router } from 'express';
import type { GearController } from '../controller/controller.js';

export function createGearRouter(controller: GearController): Router {
  const router = Router({ mergeParams: true });

  router.get('', controller.getGearForReservist);
  router.post('/issue', controller.issue);
  router.post('/return', controller.returnGear);
  router.get('/history', controller.getGearHistory);

  return router;
}
