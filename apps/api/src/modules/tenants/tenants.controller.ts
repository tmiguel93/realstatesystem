import type { Request, Response } from "express";
import { tenantIdParamSchema, tenantPayloadSchema, tenantsListQuerySchema } from "./tenants.schemas";
import { TenantsService } from "./tenants.service";
import { getRequestContext } from "../../shared/http/request-context";

const tenantsService = new TenantsService();

export class TenantsController {
  async list(request: Request, response: Response) {
    const query = tenantsListQuerySchema.parse(request.query);
    const result = await tenantsService.list(query);
    return response.status(200).json(result);
  }

  async getById(request: Request, response: Response) {
    const params = tenantIdParamSchema.parse(request.params);
    const result = await tenantsService.getById(params.id);
    return response.status(200).json(result);
  }

  async create(request: Request, response: Response) {
    const payload = tenantPayloadSchema.parse(request.body);
    const result = await tenantsService.create(payload, getRequestContext(request));
    return response.status(201).json(result);
  }

  async update(request: Request, response: Response) {
    const params = tenantIdParamSchema.parse(request.params);
    const payload = tenantPayloadSchema.parse(request.body);
    const result = await tenantsService.update(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }
}

