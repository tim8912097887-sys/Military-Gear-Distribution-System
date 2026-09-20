import type { Request, Response } from 'express';
import type { ReservistService } from '../service/service.js';
import { schemaValidator } from '../../../utils/validation/schema-validator.js';
import {
  listReservistsQuerySchema,
  reservistIdParamsSchema,
  type ListReservistsQuery,
  type ReservistIdParams,
} from './dto.js';
import { ReservistNotFoundError } from '../errors/reservist-not-found.js';
import { CheckInConflictError } from '../errors/check-in-conflict.js';
import { ServerConflictError } from '../../../applications/error/server-conflict.js';
import { NotFoundError } from '../../../applications/error/not-found.js';

export class ReservistController {
  constructor(private readonly reservistService: ReservistService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    console.log('raw query', req.query);
    const query = schemaValidator<ListReservistsQuery>(listReservistsQuerySchema)(
      req.query as unknown as ListReservistsQuery,
    );

    console.log('validated query', query);
    const data = await this.reservistService.list(query);

    this.successJson(res, data);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.reservistId as string;
    const { reservistId } = schemaValidator<ReservistIdParams>(reservistIdParamsSchema)({
      reservistId: id,
    });

    try {
      const data = await this.reservistService.getById(reservistId);
      this.successJson(res, data);
    } catch (error) {
      // Translate domain errors to http errors
      if (error instanceof ReservistNotFoundError) {
        throw new NotFoundError(error.message);
      } else {
        throw error;
      }
    }
  };

  checkIn = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.reservistId as string;
    const { reservistId } = schemaValidator<ReservistIdParams>(reservistIdParamsSchema)({
      reservistId: id,
    });

    try {
      const data = await this.reservistService.checkIn(reservistId);
      this.successJson(res, data);
    } catch (error) {
      // Translate domain errors to http errors
      if (error instanceof ReservistNotFoundError) {
        throw new NotFoundError(error.message);
      } else if (error instanceof CheckInConflictError) {
        throw new ServerConflictError(error.message);
      } else {
        throw error;
      }
    }
  };

  private successJson(res: Response, data: any): void {
    res.status(200).json({ data });
  }
}
