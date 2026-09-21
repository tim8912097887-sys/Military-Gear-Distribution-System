import { db } from '../../../infrastructure/db/db.js';
import { ReservistRepository } from '../../reservists/repository/repository.js';
import { GearController } from '../controller/controller.js';
import { GearRepository } from '../repository/repository.js';
import { createGearRouter } from '../route/route.js';
import { GearService } from '../service/service.js';

const gearRepository = new GearRepository(db);
const reservistRepository = new ReservistRepository(db);
const gearService = new GearService(gearRepository, reservistRepository);
const gearController = new GearController(gearService);
const gearRouter = createGearRouter(gearController);

export { gearRouter };
