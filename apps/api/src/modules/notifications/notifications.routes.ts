import { Router } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { NotificationsController } from "./notifications.controller";

const controller = new NotificationsController();

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/", asyncHandler(controller.list.bind(controller)));
notificationsRouter.patch(
  "/:id/read",
  asyncHandler(controller.markAsRead.bind(controller)),
);
