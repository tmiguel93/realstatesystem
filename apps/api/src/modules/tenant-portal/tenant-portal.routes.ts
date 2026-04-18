import { Router } from "express";
import { permissionCodes } from "@imobiliaria/shared";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermissions } from "../../middlewares/permission.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { uploadMiddleware } from "../../shared/http/upload";
import { TenantPortalController } from "./tenant-portal.controller";

const controller = new TenantPortalController();

export const tenantPortalRouter = Router();

tenantPortalRouter.use(requireAuth);
tenantPortalRouter.use(
  requirePermissions([permissionCodes.TENANT_PORTAL_ACCESS]),
);

tenantPortalRouter.get(
  "/overview",
  asyncHandler(controller.overview.bind(controller)),
);
tenantPortalRouter.post(
  "/maintenance-tickets",
  requirePermissions([
    permissionCodes.TENANT_PORTAL_ACCESS,
    permissionCodes.MAINTENANCE_PORTAL_OPEN,
  ]),
  uploadMiddleware.array("files", 6),
  asyncHandler(controller.openMaintenanceTicket.bind(controller)),
);
