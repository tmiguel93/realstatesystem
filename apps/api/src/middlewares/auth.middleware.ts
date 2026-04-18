import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../core/http-error";
import { verifyAccessToken } from "../core/jwt";

export type AuthContext = {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Acesso nao autenticado."));
  }

  const token = authorizationHeader.replace("Bearer ", "");

  try {
    const payload = verifyAccessToken(token);
    request.auth = {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
    };

    return next();
  } catch {
    return next(new HttpError(401, "Token de acesso invalido ou expirado."));
  }
}

