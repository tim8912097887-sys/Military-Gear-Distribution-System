import { db } from '../../../infrastructure/db/db.js';
import { InventoryController } from '../controller/controller.js';
import { InventoryRepository } from '../repository/inventory.repository.js';
import { createInventoryRouter } from '../route/route.js';
import { InventoryService } from '../service/service.js';

const inventoryRepository = new InventoryRepository(db);
const inventoryService = new InventoryService(inventoryRepository);
const inventoryController = new InventoryController(inventoryService);
const inventoryRouter = createInventoryRouter(inventoryController);

export { inventoryRouter };
