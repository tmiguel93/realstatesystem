import { Router } from "express";
import { permissionCodes } from "@imobiliaria/shared";
import { asyncHandler } from "../../shared/http/async-handler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermissions } from "../../middlewares/permission.middleware";
import { UsersController } from "./users.controller";

const controller = new UsersController();

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get(
  "/assignable",
  asyncHandler(controller.listAssignable.bind(controller)),
);
usersRouter.get(
  "/",
  requirePermissions([permissionCodes.USERS_MANAGE]),
  asyncHandler(controller.list.bind(controller)),
);
usersRouter.get(
  "/:id",
  requirePermissions([permissionCodes.USERS_MANAGE]),
  asyncHandler(controller.getById.bind(controller)),
);
usersRouter.post(
  "/",
  requirePermissions([permissionCodes.USERS_MANAGE]),
  asyncHandler(controller.create.bind(controller)),
);
usersRouter.patch(
  "/:id",
  requirePermissions([permissionCodes.USERS_MANAGE]),
  asyncHandler(controller.update.bind(controller)),
);
usersRouter.patch(
  "/:id/status",
  requirePermissions([permissionCodes.USERS_MANAGE]),
  asyncHandler(controller.updateStatus.bind(controller)),
);
usersRouter.post(
  "/:id/reset-password",
  requirePermissions([permissionCodes.USERS_MANAGE]),
  asyncHandler(controller.resetPassword.bind(controller)),
);

export const rolesRouter = Router();

rolesRouter.use(requireAuth);
rolesRouter.get(
  "/",
  requirePermissions([permissionCodes.USERS_MANAGE]),
  asyncHandler(controller.listRoles.bind(controller)),
);
