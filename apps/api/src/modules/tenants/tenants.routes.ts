import { Router } from "express";
import { permissionCodes } from "@imobiliaria/shared";
import { asyncHandler } from "../../shared/http/async-handler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermissions } from "../../middlewares/permission.middleware";
import { TenantsController } from "./tenants.controller";

const controller = new TenantsController();

export const tenantsRouter = Router();

tenantsRouter.use(requireAuth);

tenantsRouter.get(
  "/",
  requirePermissions([permissionCodes.TENANTS_READ]),
  asyncHandler(controller.list.bind(controller)),
);
tenantsRouter.get(
  "/:id",
  requirePermissions([permissionCodes.TENANTS_READ]),
  asyncHandler(controller.getById.bind(controller)),
);
tenantsRouter.post(
  "/",
  requirePermissions([permissionCodes.TENANTS_WRITE]),
  asyncHandler(controller.create.bind(controller)),
);
tenantsRouter.patch(
  "/:id",
  requirePermissions([permissionCodes.TENANTS_WRITE]),
  asyncHandler(controller.update.bind(controller)),
);
