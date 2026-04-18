import { Router } from "express";
import { permissionCodes } from "@imobiliaria/shared";
import { asyncHandler } from "../../shared/http/async-handler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermissions } from "../../middlewares/permission.middleware";
import { KeysController } from "./keys.controller";

const controller = new KeysController();

export const keysRouter = Router();

keysRouter.use(requireAuth);

keysRouter.get(
  "/",
  requirePermissions([permissionCodes.KEYS_READ]),
  asyncHandler(controller.list.bind(controller)),
);
keysRouter.get(
  "/:id",
  requirePermissions([permissionCodes.KEYS_READ]),
  asyncHandler(controller.getById.bind(controller)),
);
keysRouter.post(
  "/",
  requirePermissions([permissionCodes.KEYS_WRITE]),
  asyncHandler(controller.create.bind(controller)),
);
keysRouter.post(
  "/:id/checkout",
  requirePermissions([permissionCodes.KEYS_WRITE]),
  asyncHandler(controller.checkout.bind(controller)),
);
keysRouter.post(
  "/:id/checkin",
  requirePermissions([permissionCodes.KEYS_WRITE]),
  asyncHandler(controller.checkin.bind(controller)),
);
keysRouter.post(
  "/:id/status",
  requirePermissions([permissionCodes.KEYS_WRITE]),
  asyncHandler(controller.changeStatus.bind(controller)),
);
