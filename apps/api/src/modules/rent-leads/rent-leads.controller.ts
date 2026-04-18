import type { Request, Response } from "express";
import {
  rentLeadIdParamSchema,
  rentLeadPayloadSchema,
  rentLeadsListQuerySchema,
} from "./rent-leads.schemas";
import { RentLeadsService } from "./rent-leads.service";
import { getRequestContext } from "../../shared/http/request-context";

const rentLeadsService = new RentLeadsService();

export class RentLeadsController {
  async list(request: Request, response: Response) {
    const query = rentLeadsListQuerySchema.parse(request.query);
    const result = await rentLeadsService.list(query);
    return response.status(200).json(result);
  }

  async getById(request: Request, response: Response) {
    const params = rentLeadIdParamSchema.parse(request.params);
    const result = await rentLeadsService.getById(params.id);
    return response.status(200).json(result);
  }

  async create(request: Request, response: Response) {
    const payload = rentLeadPayloadSchema.parse(request.body);
    const result = await rentLeadsService.create(
      payload,
      getRequestContext(request),
    );
    return response.status(201).json(result);
  }

  async update(request: Request, response: Response) {
    const params = rentLeadIdParamSchema.parse(request.params);
    const payload = rentLeadPayloadSchema.parse(request.body);
    const result = await rentLeadsService.update(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }
}
