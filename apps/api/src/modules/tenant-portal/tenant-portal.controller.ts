import type { Request, Response } from "express";
import { getRequestContext } from "../../shared/http/request-context";
import { validateImageFiles } from "../../shared/http/upload";
import { storageAdapter } from "../../shared/storage/local-storage-adapter";
import { TenantPortalService } from "./tenant-portal.service";
import { tenantPortalMaintenanceCreateSchema } from "./tenant-portal.schemas";

const tenantPortalService = new TenantPortalService();

export class TenantPortalController {
  async overview(request: Request, response: Response) {
    const result = await tenantPortalService.getOverview(
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async openMaintenanceTicket(request: Request, response: Response) {
    const payload = tenantPortalMaintenanceCreateSchema.parse(request.body);
    const files = (request.files as Express.Multer.File[] | undefined) ?? [];

    if (files.length > 0) {
      validateImageFiles(
        files,
        "O portal do locatário aceita apenas imagens JPEG, PNG ou WEBP.",
      );
    }

    const storedFiles =
      files.length > 0
        ? await Promise.all(
            files.map((file) =>
              storageAdapter.saveFile({
                folder: "maintenance/tenant-portal",
                originalName: file.originalname,
                mimeType: file.mimetype,
                buffer: file.buffer,
              }),
            ),
          )
        : [];

    const result = await tenantPortalService.openMaintenanceTicket(
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
