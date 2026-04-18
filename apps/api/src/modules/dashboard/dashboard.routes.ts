import { Router } from "express";
import { permissionCodes } from "@imobiliaria/shared";
import { asyncHandler } from "../../shared/http/async-handler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermissions } from "../../middlewares/permission.middleware";
import { DashboardController } from "./dashboard.controller";

const controller = new DashboardController();

export const dashboardRouter = Router();

dashboardRouter.get(
  "/summary",
  requireAuth,
  requirePermissions([permissionCodes.DASHBOARD_READ]),
  asyncHandler(controller.summary.bind(controller)),
);

