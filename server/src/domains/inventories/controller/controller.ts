import type { Request, Response } from 'express';
import { schemaValidator } from '../../../utils/validation/schema-validator.js';
import { successResponse } from '../../../utils/response/success.js';
import type { InventoryService } from '../service/service.js';

import { inventoryAdjustmentBodySchema, type InventoryAdjustmentBody } from './dto.js';

export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.inventoryService.list();
    this.successJson(res, data);
  };

  adjust = async (req: Request, res: Response): Promise<void> => {
    const body = schemaValidator<InventoryAdjustmentBody>(inventoryAdjustmentBodySchema)(req.body);

    const data = await this.inventoryService.adjust(body);
    this.successJson(res, data);
  };

  private successJson<T>(res: Response, data: T): void {
    res.status(200).json(successResponse(data));
  }
}
