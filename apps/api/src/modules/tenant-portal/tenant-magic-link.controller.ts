import type { Request, Response } from "express";
import { getRequestContext } from "../../shared/http/request-context";
import { validateImageFiles } from "../../shared/http/upload";
import { storageAdapter } from "../../shared/storage/local-storage-adapter";
import { HttpError } from "../../core/http-error";
import { contractIdParamSchema } from "../contracts/contracts.schemas";
import { TenantMagicLinkService } from "./tenant-magic-link.service";
import {
  tenantMagicLinkGenerateSchema,
  tenantMagicLinkTicketCreateSchema,
} from "./tenant-magic-link.schemas";

const tenantMagicLinkService = new TenantMagicLinkService();

export function resolveTenantMagicLinkToken(request: Request) {
  const token = request.headers["x-tenant-link-token"];

  if (Array.isArray(token)) {
    return token[0] ?? "";
  }

  if (typeof token === "string") {
    return token;
  }

  throw new HttpError(401, "Informe o token do link seguro.");
}

export class TenantMagicLinkController {
  async getForContract(request: Request, response: Response) {
    const params = contractIdParamSchema.parse(request.params);
    const result = await tenantMagicLinkService.getForContract(params.id);
    return response.status(200).json(result);
  }

  async generateForContract(request: Request, response: Response) {
    const params = contractIdParamSchema.parse(request.params);
    const payload = tenantMagicLinkGenerateSchema.parse(request.body ?? {});
    const result = await tenantMagicLinkService.generateForContract(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(201).json(result);
  }

  async revokeForContract(request: Request, response: Response) {
    const params = contractIdParamSchema.parse(request.params);
    const result = await tenantMagicLinkService.revokeForContract(
      params.id,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async publicOverview(request: Request, response: Response) {
    const result = await tenantMagicLinkService.getPublicOverview(
      resolveTenantMagicLinkToken(request),
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async publicOpenMaintenanceTicket(request: Request, response: Response) {
    const payload = tenantMagicLinkTicketCreateSchema.parse(request.body);
    const files = (request.files as Express.Multer.File[] | undefined) ?? [];

    if (files.length > 0) {
      validateImageFiles(
        files,
        "O link seguro aceita apenas imagens JPEG, PNG ou WEBP.",
      );
    }

    const storedFiles =
      files.length > 0
        ? await Promise.all(
            files.map((file) =>
              storageAdapter.saveFile({
                folder: "maintenance/tenant-magic-link",
                originalName: file.originalname,
                mimeType: file.mimetype,
                buffer: file.buffer,
              }),
            ),
          )
        : [];

    const result = await tenantMagicLinkService.openMaintenanceTicket(
      resolveTenantMagicLinkToken(request),
      {
        ...payload,
        attachments: storedFiles.map((file) => ({
          name: file.fileName,
          fileUrl: file.fileUrl,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
        })),
      },
      getRequestContext(request),
    );

    return response.status(201).json(result);
  }
}
