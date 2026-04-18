import { Router } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { AuthController } from "./auth.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const controller = new AuthController();

export const authRouter = Router();

authRouter.post("/login", asyncHandler(controller.login.bind(controller)));
authRouter.post("/refresh", asyncHandler(controller.refresh.bind(controller)));
authRouter.post("/logout", asyncHandler(controller.logout.bind(controller)));
authRouter.post(
  "/forgot-password",
  asyncHandler(controller.forgotPassword.bind(controller)),
);
authRouter.post(
  "/reset-password",
  asyncHandler(controller.resetPassword.bind(controller)),
);
authRouter.get("/me", requireAuth, asyncHandler(controller.me.bind(controller)));
