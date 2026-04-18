import type { Request, Response } from "express";
import {
  propertyIdParamSchema,
  propertyPayloadSchema,
  propertiesListQuerySchema,
} from "./properties.schemas";
import { PropertiesService } from "./properties.service";
import { getRequestContext } from "../../shared/http/request-context";

const propertiesService = new PropertiesService();

export class PropertiesController {
  async list(request: Request, response: Response) {
    const query = propertiesListQuerySchema.parse(request.query);
    const result = await propertiesService.list(query);
    return response.status(200).json(result);
  }

  async getById(request: Request, response: Response) {
    const params = propertyIdParamSchema.parse(request.params);
    const result = await propertiesService.getById(params.id);
    return response.status(200).json(result);
  }

  async create(request: Request, response: Response) {
    const payload = propertyPayloadSchema.parse(request.body);
    const result = await propertiesService.create(
      payload,
      getRequestContext(request),
    );
    return response.status(201).json(result);
  }

  async update(request: Request, response: Response) {
    const params = propertyIdParamSchema.parse(request.params);
    const payload = propertyPayloadSchema.parse(request.body);
    const result = await propertiesService.update(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }
}

