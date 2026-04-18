import type { Request, Response } from "express";
import {
  visitIdParamSchema,
  visitPayloadSchema,
  visitsListQuerySchema,
} from "./visits.schemas";
import { VisitsService } from "./visits.service";
import { getRequestContext } from "../../shared/http/request-context";

const visitsService = new VisitsService();

export class VisitsController {
  async list(request: Request, response: Response) {
    const query = visitsListQuerySchema.parse(request.query);
    const result = await visitsService.list(query);
    return response.status(200).json(result);
  }

  async getById(request: Request, response: Response) {
    const params = visitIdParamSchema.parse(request.params);
    const result = await visitsService.getById(params.id);
    return response.status(200).json(result);
  }

  async create(request: Request, response: Response) {
    const payload = visitPayloadSchema.parse(request.body);
    const result = await visitsService.create(payload, getRequestContext(request));
    return response.status(201).json(result);
  }

  async update(request: Request, response: Response) {
    const params = visitIdParamSchema.parse(request.params);
    const payload = visitPayloadSchema.parse(request.body);
    const result = await visitsService.update(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }
}
