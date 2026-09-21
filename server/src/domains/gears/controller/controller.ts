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
  type GetGearQuery,
  type IssueGearBody,
} from '../service/dto.js';
import { NotFoundError } from '../../../applications/error/not-found.js';
import { ReservistNotFoundError } from '../../reservists/errors/reservist-not-found.js';
import { AllowanceExceededError } from '../errors/allowance-exceeded.js';
import { ServerConflictError } from '../../../applications/error/server-conflict.js';
import { InventoryItemNotFoundError } from '../errors/inventory-item-not-found.js';
import { CategoryNotFoundError } from '../errors/category-not-found.js';
import { CustodyCreationError } from '../errors/custody-creation.js';
import { InsufficientStockError } from '../errors/insufficient-stock.js';
import { SerializedItemNotFoundError } from '../errors/serialized-item-not-found.js';

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

    try {
      const data = await this.gearService.getGear(reservistId, query);
      this.successJson(res, data);
    } catch (error) {
      this.handleError(error);
    }
  };

  issue = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.reservistId as string;
    const { reservistId } = schemaValidator<ReservistIdParams>(reservistIdParamsSchema)({
      reservistId: id,
    });
    const body = schemaValidator<IssueGearBody>(issueGearBodySchema)(req.body);
    try {
      const { data } = await this.gearService.issue(reservistId, body);
      this.successJson(res, data);
    } catch (error) {
      this.handleError(error);
    }
  };

  // returnGear = async (req: Request, res: Response): Promise<void> => {
  //   const { reservistId } = parseParams(reservistIdParamsSchema, req.params);
  //   const body = parseBody(returnGearBodySchema, req.body);
  //   const { data, replayed } = await this.gearService.returnGear(reservistId, body);
  //   res.status(200).json({ data, meta: { replayed } });
  // };

  private handleError(error: unknown): void {
    if (error instanceof ReservistNotFoundError) {
      throw new NotFoundError(error.message);
    } else if (error instanceof AllowanceExceededError) {
      throw new ServerConflictError(error.message);
    } else if (error instanceof InventoryItemNotFoundError) {
      throw new NotFoundError(error.message);
    } else if (error instanceof CategoryNotFoundError) {
      throw new NotFoundError(error.message);
    } else if (error instanceof CustodyCreationError) {
      throw new ServerConflictError(error.message);
    } else if (error instanceof InsufficientStockError) {
      throw new ServerConflictError(error.message);
    } else if (error instanceof SerializedItemNotFoundError) {
      throw new NotFoundError(error.message);
    }
  }

  private successJson(res: Response, data: any): void {
    res.status(200).json({ data });
  }
}
