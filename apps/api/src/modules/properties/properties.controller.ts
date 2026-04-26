import type { Request, Response } from "express";
import {
  propertyIdParamSchema,
  propertyImageIdParamSchema,
  propertyImageReorderSchema,
  propertyImageUpdateSchema,
  propertyPayloadSchema,
  propertiesListQuerySchema,
} from "./properties.schemas";
import { PropertiesService } from "./properties.service";
import { getRequestContext } from "../../shared/http/request-context";
import { storageAdapter } from "../../shared/storage/local-storage-adapter";
import { assertFilesPresent, validateImageFiles } from "../../shared/http/upload";

const propertiesService = new PropertiesService();

export class PropertiesController {
  async list(request: Request, response: Response) {
    const query = propertiesListQuerySchema.parse(request.query);
    const result = await propertiesService.list(query);
    return response.status(200).json(result);
  }

  async getById(request: Request, response: Response) {
    const params = propertyIdParamSchema.parse(request.params);
    const result = await propertiesService.getById(
      params.id,
      getRequestContext(request),
    );
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

  async uploadImages(request: Request, response: Response) {
    const params = propertyIdParamSchema.parse(request.params);
    const files = (request.files as Express.Multer.File[] | undefined) ?? [];

    assertFilesPresent(files, "Envie ao menos uma foto do imóvel.");
    validateImageFiles(files, "Somente imagens JPEG, PNG ou WEBP são aceitas.");

    const storedImages = await Promise.all(
      files.map((file) =>
        storageAdapter.saveFile({
          folder: `properties/${params.id}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          buffer: file.buffer,
        }),
      ),
    );

    const result = await propertiesService.addImages(
      params.id,
      storedImages,
      getRequestContext(request),
    );
    return response.status(201).json(result);
  }

  async updateImage(request: Request, response: Response) {
    const params = propertyImageIdParamSchema.parse(request.params);
    const payload = propertyImageUpdateSchema.parse(request.body);
    const result = await propertiesService.updateImage(
      params.id,
      params.imageId,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async reorderImages(request: Request, response: Response) {
    const params = propertyIdParamSchema.parse(request.params);
    const payload = propertyImageReorderSchema.parse(request.body);
    const result = await propertiesService.reorderImages(
      params.id,
      payload.imageIds,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async removeImage(request: Request, response: Response) {
    const params = propertyImageIdParamSchema.parse(request.params);
    const result = await propertiesService.removeImage(
      params.id,
      params.imageId,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }
}
