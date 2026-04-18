import type { Request } from "express";

export function getRequestContext(request: Request) {
  return {
    actorUserId: request.auth?.userId,
    ipAddress: request.ip,
    userAgent: request.headers["user-agent"],
    permissions: request.auth?.permissions,
    roles: request.auth?.roles,
  };
}
