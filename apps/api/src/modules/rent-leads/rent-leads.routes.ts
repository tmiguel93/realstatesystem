import { Router } from "express";
import { permissionCodes } from "@imobiliaria/shared";
import { asyncHandler } from "../../shared/http/async-handler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermissions } from "../../middlewares/permission.middleware";
import { RentLeadsController } from "./rent-leads.controller";

const controller = new RentLeadsController();

export const rentLeadsRouter = Router();

rentLeadsRouter.use(requireAuth);

rentLeadsRouter.get(
  "/",
  requirePermissions([permissionCodes.RENT_LEADS_READ]),
  asyncHandler(controller.list.bind(controller)),
);
rentLeadsRouter.get(
  "/:id",
  requirePermissions([permissionCodes.RENT_LEADS_READ]),
  asyncHandler(controller.getById.bind(controller)),
);
rentLeadsRouter.post(
  "/",
  requirePermissions([permissionCodes.RENT_LEADS_WRITE]),
  asyncHandler(controller.create.bind(controller)),
);
rentLeadsRouter.patch(
  "/:id",
  requirePermissions([permissionCodes.RENT_LEADS_WRITE]),
  asyncHandler(controller.update.bind(controller)),
);
