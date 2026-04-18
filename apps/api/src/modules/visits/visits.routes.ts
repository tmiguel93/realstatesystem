import { Router } from "express";
import { permissionCodes } from "@imobiliaria/shared";
import { asyncHandler } from "../../shared/http/async-handler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermissions } from "../../middlewares/permission.middleware";
import { VisitsController } from "./visits.controller";

const controller = new VisitsController();

export const visitsRouter = Router();

visitsRouter.use(requireAuth);

visitsRouter.get(
  "/",
  requirePermissions([permissionCodes.VISITS_READ]),
  asyncHandler(controller.list.bind(controller)),
);
visitsRouter.get(
  "/:id",
  requirePermissions([permissionCodes.VISITS_READ]),
  asyncHandler(controller.getById.bind(controller)),
);
visitsRouter.post(
  "/",
  requirePermissions([permissionCodes.VISITS_WRITE]),
  asyncHandler(controller.create.bind(controller)),
);
visitsRouter.patch(
  "/:id",
  requirePermissions([permissionCodes.VISITS_WRITE]),
  asyncHandler(controller.update.bind(controller)),
);
