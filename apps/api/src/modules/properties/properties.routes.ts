import { Router } from "express";
import { permissionCodes } from "@imobiliaria/shared";
import { asyncHandler } from "../../shared/http/async-handler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermissions } from "../../middlewares/permission.middleware";
import { PropertiesController } from "./properties.controller";

const controller = new PropertiesController();

export const propertiesRouter = Router();

propertiesRouter.use(requireAuth);

propertiesRouter.get(
  "/",
  requirePermissions([permissionCodes.PROPERTIES_READ]),
  asyncHandler(controller.list.bind(controller)),
);
propertiesRouter.get(
  "/:id",
  requirePermissions([permissionCodes.PROPERTIES_READ]),
  asyncHandler(controller.getById.bind(controller)),
);
propertiesRouter.post(
  "/",
  requirePermissions([permissionCodes.PROPERTIES_WRITE]),
  asyncHandler(controller.create.bind(controller)),
);
propertiesRouter.patch(
  "/:id",
  requirePermissions([permissionCodes.PROPERTIES_WRITE]),
  asyncHandler(controller.update.bind(controller)),
);

