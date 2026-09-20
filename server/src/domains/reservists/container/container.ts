import { ReservistRepository } from '../repository/repository.js';
import { db } from '../../../infrastructure/db/db.js';
import { ReservistService } from '../service/service.js';
import { ReservistController } from '../controller/controller.js';
import { createReservistRouter } from '../route/route.js';

const reservistRepository = new ReservistRepository(db);
const reservistService = new ReservistService(reservistRepository);
const reservistController = new ReservistController(reservistService);
const reservistRouter = createReservistRouter(reservistController);

export { reservistRouter };
