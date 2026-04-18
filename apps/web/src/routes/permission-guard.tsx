import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { appRoutes } from "@imobiliaria/shared";
import { useAuth } from "@/features/auth/auth-context";

type PermissionGuardProps = PropsWithChildren<{
  permissions: string[];
}>;

export function PermissionGuard({
  permissions,
  children,
}: PermissionGuardProps) {
  const { hasPermission } = useAuth();

  const allowed = permissions.every((permission) => hasPermission(permission));

  if (!allowed) {
    return <Navigate to={appRoutes.forbidden} replace />;
  }

  return <>{children}</>;
}
