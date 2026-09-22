import type { Request, Response } from 'express';
import type { GearService } from '../service/service.js';
import { schemaValidator } from '../../../utils/validation/schema-validator.js';
import {
  reservistIdParamsSchema,
  type ReservistIdParams,
} from '../../reservists/controller/dto.js';
import {
  getGearQuerySchema,
  issueGearBodySchema,
  returnGearBodySchema,
  type GetGearQuery,
  type IssueGearBody,
  type ReturnGearBody,
} from './dto.js';

export class GearController {
  constructor(private readonly gearService: GearService) {}

  getGearForReservist = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.reservistId as string;
    const { reservistId } = schemaValidator<ReservistIdParams>(reservistIdParamsSchema)({
      reservistId: id,
    });
    const query = schemaValidator<GetGearQuery>(getGearQuerySchema)(
      req.query as unknown as GetGearQuery,
    );

    const data = await this.gearService.getGear(reservistId, query);
    this.successJson(res, data);
  };

  issue = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.reservistId as string;
    const { reservistId } = schemaValidator<ReservistIdParams>(reservistIdParamsSchema)({
      reservistId: id,
    });
    const body = schemaValidator<IssueGearBody>(issueGearBodySchema)(req.body);

    const { data } = await this.gearService.issue(reservistId, body);
    this.successJson(res, data);
  };

  returnGear = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.reservistId as string;
    const { reservistId } = schemaValidator<ReservistIdParams>(reservistIdParamsSchema)({
      reservistId: id,
    });
    const body = schemaValidator<ReturnGearBody>(returnGearBodySchema)(req.body);

    const { data } = await this.gearService.returnGear(reservistId, body);
    this.successJson(res, data);
  };

  private successJson<T>(res: Response, data: T): void {
    res.status(200).json({ data });
  }
}
