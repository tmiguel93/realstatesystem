import { Router } from "express";
import { permissionCodes } from "@imobiliaria/shared";
import { asyncHandler } from "../../shared/http/async-handler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermissions } from "../../middlewares/permission.middleware";
import { OwnersController } from "./owners.controller";

const controller = new OwnersController();

export const ownersRouter = Router();

ownersRouter.use(requireAuth);

ownersRouter.get(
  "/",
  requirePermissions([permissionCodes.OWNERS_READ]),
  asyncHandler(controller.list.bind(controller)),
);
ownersRouter.get(
  "/:id",
  requirePermissions([permissionCodes.OWNERS_READ]),
  asyncHandler(controller.getById.bind(controller)),
);
ownersRouter.post(
  "/",
  requirePermissions([permissionCodes.OWNERS_WRITE]),
  asyncHandler(controller.create.bind(controller)),
);
ownersRouter.patch(
  "/:id",
  requirePermissions([permissionCodes.OWNERS_WRITE]),
  asyncHandler(controller.update.bind(controller)),
);

