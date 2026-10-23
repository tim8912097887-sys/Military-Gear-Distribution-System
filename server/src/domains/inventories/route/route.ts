import { Router } from 'express';
import type { InventoryController } from '../controller/controller.js';

export function createInventoryRouter(controller: InventoryController): Router {
  const router = Router();

  router.get('', controller.list);
  router.post('/adjustment', controller.adjust);

  return router;
}
