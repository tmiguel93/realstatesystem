import { Router } from "express";
import { permissionCodes } from "@imobiliaria/shared";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermissions } from "../../middlewares/permission.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { ContactsController } from "./contacts.controller";

const controller = new ContactsController();

export const contactsRouter = Router();

contactsRouter.use(requireAuth);

contactsRouter.get(
  "/",
  requirePermissions([permissionCodes.CONTACTS_READ]),
  asyncHandler(controller.list.bind(controller)),
);

contactsRouter.post(
  "/",
  requirePermissions([permissionCodes.CONTACTS_WRITE]),
  asyncHandler(controller.create.bind(controller)),
);

contactsRouter.patch(
  "/:id",
  requirePermissions([permissionCodes.CONTACTS_WRITE]),
  asyncHandler(controller.update.bind(controller)),
);
