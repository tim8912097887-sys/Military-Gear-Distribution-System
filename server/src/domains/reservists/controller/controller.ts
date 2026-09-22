import type { Request, Response } from 'express';
import type { ReservistService } from '../service/service.js';
import { schemaValidator } from '../../../utils/validation/schema-validator.js';
import {
  listReservistsQuerySchema,
  reservistIdParamsSchema,
  type ListReservistsQuery,
  type ReservistIdParams,
} from './dto.js';
import { successResponse } from '../../../utils/response/success.js';

export class ReservistController {
  constructor(private readonly reservistService: ReservistService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const query = schemaValidator<ListReservistsQuery>(listReservistsQuerySchema)(
      req.query as unknown as ListReservistsQuery,
    );

    const data = await this.reservistService.list(query);

    this.successJson(res, data);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.reservistId as string;
    const { reservistId } = schemaValidator<ReservistIdParams>(reservistIdParamsSchema)({
      reservistId: id,
    });

    const data = await this.reservistService.getById(reservistId);
    this.successJson(res, data);
  };

  checkIn = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.reservistId as string;
    const { reservistId } = schemaValidator<ReservistIdParams>(reservistIdParamsSchema)({
      reservistId: id,
    });

    const data = await this.reservistService.checkIn(reservistId);
    this.successJson(res, data);
  };

  private successJson<T>(res: Response, data: T): void {
    res.status(200).json(successResponse(data));
  }
}
