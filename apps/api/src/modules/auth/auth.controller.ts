import type { Request, Response } from "express";
import { env } from "../../config/env";
import { AuthService } from "./auth.service";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
  userPreferencesSchema,
} from "./auth.schemas";

const authService = new AuthService();

function getRequestContext(request: Request) {
  return {
    ipAddress: request.ip,
    userAgent: request.headers["user-agent"],
  };
}

function applyRefreshCookie(response: Response, refreshToken: string) {
  response.cookie(env.REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearRefreshCookie(response: Response) {
  response.clearCookie(env.REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export class AuthController {
  async login(request: Request, response: Response) {
    const payload = loginSchema.parse(request.body);
    const result = await authService.login(
      payload.email,
      payload.senha,
      getRequestContext(request),
    );

    applyRefreshCookie(response, result.refreshToken);

    return response.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  async refresh(request: Request, response: Response) {
    const body = refreshSchema.parse(request.body ?? {});
    const refreshToken =
      request.cookies[env.REFRESH_COOKIE_NAME] ?? body.refreshToken;

    const result = await authService.refresh(
      refreshToken,
      getRequestContext(request),
    );

    applyRefreshCookie(response, result.refreshToken);

    return response.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  async logout(request: Request, response: Response) {
    const refreshToken = request.cookies[env.REFRESH_COOKIE_NAME];

    await authService.logout(refreshToken, request.auth?.userId);
    clearRefreshCookie(response);

    return response.status(200).json({
      message: "Sessao encerrada com sucesso.",
    });
  }

  async forgotPassword(request: Request, response: Response) {
    const payload = forgotPasswordSchema.parse(request.body);
    const result = await authService.forgotPassword(
      payload.email,
      getRequestContext(request),
    );

    return response.status(200).json(result);
  }

  async resetPassword(request: Request, response: Response) {
    const payload = resetPasswordSchema.parse(request.body);
    const result = await authService.resetPassword(
      payload.token,
      payload.novaSenha,
      getRequestContext(request),
    );

    return response.status(200).json(result);
  }

  async me(request: Request, response: Response) {
    const user = await authService.me(request.auth!.userId);

    return response.status(200).json(user);
  }

  async updatePreferences(request: Request, response: Response) {
    const payload = userPreferencesSchema.parse(request.body);
    const user = await authService.updatePreferences(
      request.auth!.userId,
      payload,
      getRequestContext(request),
    );

    return response.status(200).json(user);
  }
}
