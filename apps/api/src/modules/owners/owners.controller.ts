import type { Request, Response } from "express";
import { ownerIdParamSchema, ownerPayloadSchema, ownersListQuerySchema } from "./owners.schemas";
import { OwnersService } from "./owners.service";
import { getRequestContext } from "../../shared/http/request-context";

const ownersService = new OwnersService();

export class OwnersController {
  async list(request: Request, response: Response) {
    const query = ownersListQuerySchema.parse(request.query);
    const result = await ownersService.list(query);
    return response.status(200).json(result);
  }

  async getById(request: Request, response: Response) {
    const params = ownerIdParamSchema.parse(request.params);
    const result = await ownersService.getById(params.id);
    return response.status(200).json(result);
  }

  async create(request: Request, response: Response) {
    const payload = ownerPayloadSchema.parse(request.body);
    const result = await ownersService.create(payload, getRequestContext(request));
    return response.status(201).json(result);
  }

  async update(request: Request, response: Response) {
    const params = ownerIdParamSchema.parse(request.params);
    const payload = ownerPayloadSchema.parse(request.body);
    const result = await ownersService.update(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }
}

