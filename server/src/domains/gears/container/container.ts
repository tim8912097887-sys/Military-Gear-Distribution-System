import { db } from '../../../infrastructure/db/db.js';
import { ReservistRepository } from '../../reservists/repository/repository.js';
import { GearController } from '../controller/controller.js';
import { GearReadRepository } from '../repository/gear-read.repository.js';
import { GearWriteRepository } from '../repository/gear-write.repository.js';
import { createGearRouter } from '../route/route.js';
import { GearService } from '../service/service.js';

const gearReadRepository = new GearReadRepository(db);
const gearWriteRepository = new GearWriteRepository(db);
const reservistRepository = new ReservistRepository(db);
const gearService = new GearService(gearReadRepository, gearWriteRepository, reservistRepository);
const gearController = new GearController(gearService);
const gearRouter = createGearRouter(gearController);

export { gearRouter };
