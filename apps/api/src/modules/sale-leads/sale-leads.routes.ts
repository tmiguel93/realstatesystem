import { Router } from "express";
import { permissionCodes } from "@imobiliaria/shared";
import { asyncHandler } from "../../shared/http/async-handler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermissions } from "../../middlewares/permission.middleware";
import { SaleLeadsController } from "./sale-leads.controller";

const controller = new SaleLeadsController();

export const saleLeadsRouter = Router();

saleLeadsRouter.use(requireAuth);

saleLeadsRouter.get(
  "/",
  requirePermissions([permissionCodes.SALE_LEADS_READ]),
  asyncHandler(controller.list.bind(controller)),
);
saleLeadsRouter.get(
  "/:id",
  requirePermissions([permissionCodes.SALE_LEADS_READ]),
  asyncHandler(controller.getById.bind(controller)),
);
saleLeadsRouter.post(
  "/",
  requirePermissions([permissionCodes.SALE_LEADS_WRITE]),
  asyncHandler(controller.create.bind(controller)),
);
saleLeadsRouter.patch(
  "/:id",
  requirePermissions([permissionCodes.SALE_LEADS_WRITE]),
  asyncHandler(controller.update.bind(controller)),
);
