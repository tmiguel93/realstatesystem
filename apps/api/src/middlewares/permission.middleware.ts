import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../core/http-error";

export function requirePermissions(requiredPermissions: string[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const userPermissions = request.auth?.permissions ?? [];

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      return next(
        new HttpError(
          403,
          "Voce nao possui permissao para acessar este recurso.",
        ),
      );
    }

    return next();
  };
}

