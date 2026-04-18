import type { Request, Response } from "express";
import {
  saleLeadIdParamSchema,
  saleLeadPayloadSchema,
  saleLeadsListQuerySchema,
} from "./sale-leads.schemas";
import { SaleLeadsService } from "./sale-leads.service";
import { getRequestContext } from "../../shared/http/request-context";

const saleLeadsService = new SaleLeadsService();

export class SaleLeadsController {
  async list(request: Request, response: Response) {
    const query = saleLeadsListQuerySchema.parse(request.query);
    const result = await saleLeadsService.list(query);
    return response.status(200).json(result);
  }

  async getById(request: Request, response: Response) {
    const params = saleLeadIdParamSchema.parse(request.params);
    const result = await saleLeadsService.getById(params.id);
    return response.status(200).json(result);
  }

  async create(request: Request, response: Response) {
    const payload = saleLeadPayloadSchema.parse(request.body);
    const result = await saleLeadsService.create(
      payload,
      getRequestContext(request),
    );
    return response.status(201).json(result);
  }

  async update(request: Request, response: Response) {
    const params = saleLeadIdParamSchema.parse(request.params);
    const payload = saleLeadPayloadSchema.parse(request.body);
    const result = await saleLeadsService.update(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }
}
