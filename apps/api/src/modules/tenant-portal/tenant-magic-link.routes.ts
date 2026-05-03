import { Router } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { uploadMiddleware } from "../../shared/http/upload";
import { TenantMagicLinkController } from "./tenant-magic-link.controller";

const controller = new TenantMagicLinkController();

export const tenantMagicLinkPublicRouter = Router();

tenantMagicLinkPublicRouter.get(
  "/overview",
  asyncHandler(controller.publicOverview.bind(controller)),
);

tenantMagicLinkPublicRouter.post(
  "/maintenance-tickets",
  uploadMiddleware.array("files", 6),
  asyncHandler(controller.publicOpenMaintenanceTicket.bind(controller)),
);
