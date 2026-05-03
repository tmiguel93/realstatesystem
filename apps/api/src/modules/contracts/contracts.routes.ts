import { Router } from "express";
import { permissionCodes } from "@imobiliaria/shared";
import { asyncHandler } from "../../shared/http/async-handler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermissions } from "../../middlewares/permission.middleware";
import { ContractsController } from "./contracts.controller";

const controller = new ContractsController();

export const contractsRouter = Router();

contractsRouter.use(requireAuth);

contractsRouter.get(
  "/",
  requirePermissions([permissionCodes.CONTRACTS_READ]),
  asyncHandler(controller.list.bind(controller)),
);
contractsRouter.get(
  "/termination/rules",
  requirePermissions([permissionCodes.LEASE_TERMINATION_SIMULATE]),
  asyncHandler(controller.listTerminationRules.bind(controller)),
);
contractsRouter.post(
  "/termination/rules",
  requirePermissions([permissionCodes.LEASE_TERMINATION_RULES_MANAGE]),
  asyncHandler(controller.saveTerminationRule.bind(controller)),
);
contractsRouter.get(
  "/:id",
  requirePermissions([permissionCodes.CONTRACTS_READ]),
  asyncHandler(controller.getById.bind(controller)),
);
contractsRouter.get(
  "/:id/tenant-magic-link",
  requirePermissions([permissionCodes.CONTRACTS_READ]),
  asyncHandler(controller.getTenantMagicLink.bind(controller)),
);
contractsRouter.post(
  "/:id/tenant-magic-link",
  requirePermissions([permissionCodes.CONTRACTS_GENERATE]),
  asyncHandler(controller.generateTenantMagicLink.bind(controller)),
);
contractsRouter.post(
  "/:id/tenant-magic-link/revoke",
  requirePermissions([permissionCodes.CONTRACTS_GENERATE]),
  asyncHandler(controller.revokeTenantMagicLink.bind(controller)),
);
contractsRouter.post(
  "/",
  requirePermissions([permissionCodes.CONTRACTS_GENERATE]),
  asyncHandler(controller.create.bind(controller)),
);
contractsRouter.post(
  "/:id/versions",
  requirePermissions([permissionCodes.CONTRACTS_GENERATE]),
  asyncHandler(controller.createVersion.bind(controller)),
);
contractsRouter.post(
  "/:id/versions/:versionId/review",
  requirePermissions([permissionCodes.CONTRACTS_REVIEW]),
  asyncHandler(controller.reviewVersion.bind(controller)),
);
contractsRouter.get(
  "/:id/versions/:versionId/pdf",
  requirePermissions([permissionCodes.CONTRACTS_EXPORT]),
  asyncHandler(controller.downloadPdf.bind(controller)),
);
contractsRouter.patch(
  "/:id/status",
  requirePermissions([permissionCodes.CONTRACTS_REVIEW]),
  asyncHandler(controller.updateStatus.bind(controller)),
);
contractsRouter.post(
  "/:id/termination/simulate",
  requirePermissions([permissionCodes.LEASE_TERMINATION_SIMULATE]),
  asyncHandler(controller.simulateTermination.bind(controller)),
);
contractsRouter.post(
  "/:id/termination/confirm",
  requirePermissions([permissionCodes.LEASE_TERMINATION_EXECUTE]),
  asyncHandler(controller.confirmTermination.bind(controller)),
);
