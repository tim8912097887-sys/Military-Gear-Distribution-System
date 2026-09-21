import { Router } from 'express';
import type { GearController } from '../controller/controller.js';

/**
 * Mounted at /api/v1/reservists/:reservistId/gear. mergeParams lets this
 * router read :reservistId from the parent mount path while keeping all gear
 * logic inside the gear feature.
 */
export function createGearRouter(controller: GearController): Router {
  const router = Router({ mergeParams: true });

  router.get('/reservists/:reservistId', controller.getGearForReservist);
  router.post('/reservists/:reservistId/issue', controller.issue);
  // router.post('/return', controller.returnGear);

  return router;
}
