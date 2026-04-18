import type { Request, Response } from "express";
import {
  keyCheckinPayloadSchema,
  keyCheckoutPayloadSchema,
  keyIdParamSchema,
  keyPayloadSchema,
  keysListQuerySchema,
  keyStatusPayloadSchema,
} from "./keys.schemas";
import { KeysService } from "./keys.service";
import { getRequestContext } from "../../shared/http/request-context";

const keysService = new KeysService();

export class KeysController {
  async list(request: Request, response: Response) {
    const query = keysListQuerySchema.parse(request.query);
    const result = await keysService.list(query);
    return response.status(200).json(result);
  }

  async getById(request: Request, response: Response) {
    const params = keyIdParamSchema.parse(request.params);
    const result = await keysService.getById(params.id);
    return response.status(200).json(result);
  }

  async create(request: Request, response: Response) {
    const payload = keyPayloadSchema.parse(request.body);
    const result = await keysService.create(payload, getRequestContext(request));
    return response.status(201).json(result);
  }

  async checkout(request: Request, response: Response) {
    const params = keyIdParamSchema.parse(request.params);
    const payload = keyCheckoutPayloadSchema.parse(request.body);
    const result = await keysService.checkout(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async checkin(request: Request, response: Response) {
    const params = keyIdParamSchema.parse(request.params);
    const payload = keyCheckinPayloadSchema.parse(request.body);
    const result = await keysService.checkin(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async changeStatus(request: Request, response: Response) {
    const params = keyIdParamSchema.parse(request.params);
    const payload = keyStatusPayloadSchema.parse(request.body);
    const result = await keysService.changeStatus(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }
}
