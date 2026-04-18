import { Router } from "express";
import { permissionCodes } from "@imobiliaria/shared";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermissions } from "../../middlewares/permission.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { MaintenanceController } from "./maintenance.controller";

const controller = new MaintenanceController();

export const maintenanceRouter = Router();

maintenanceRouter.use(requireAuth);

maintenanceRouter.get(
  "/dashboard",
  requirePermissions([permissionCodes.MAINTENANCE_READ]),
  asyncHandler(controller.dashboard.bind(controller)),
);
maintenanceRouter.get(
  "/kanban",
  requirePermissions([permissionCodes.MAINTENANCE_READ]),
  asyncHandler(controller.kanban.bind(controller)),
);
maintenanceRouter.get(
  "/property-context",
  requirePermissions([permissionCodes.MAINTENANCE_READ]),
  asyncHandler(controller.getPropertyContext.bind(controller)),
);
maintenanceRouter.get(
  "/",
  requirePermissions([permissionCodes.MAINTENANCE_READ]),
  asyncHandler(controller.list.bind(controller)),
);
maintenanceRouter.get(
  "/:id/history",
  requirePermissions([permissionCodes.MAINTENANCE_READ]),
  asyncHandler(controller.getHistory.bind(controller)),
);
maintenanceRouter.get(
  "/:id",
  requirePermissions([permissionCodes.MAINTENANCE_READ]),
  asyncHandler(controller.getById.bind(controller)),
);
maintenanceRouter.post(
  "/",
  requirePermissions([permissionCodes.MAINTENANCE_WRITE]),
  asyncHandler(controller.create.bind(controller)),
);
maintenanceRouter.patch(
  "/:id",
  requirePermissions([permissionCodes.MAINTENANCE_WRITE]),
  asyncHandler(controller.update.bind(controller)),
);
maintenanceRouter.patch(
  "/:id/status",
  requirePermissions([permissionCodes.MAINTENANCE_WRITE]),
  asyncHandler(controller.updateStatus.bind(controller)),
);
