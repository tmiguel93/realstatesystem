import { appRoutes, permissionCodes } from "@imobiliaria/shared";

export function resolveHomeRoute(permissions: string[]) {
  if (permissions.includes(permissionCodes.DASHBOARD_READ)) {
    return appRoutes.dashboard;
  }

  if (permissions.includes(permissionCodes.TENANT_PORTAL_ACCESS)) {
    return appRoutes.tenantPortal;
  }

  if (permissions.includes(permissionCodes.MAINTENANCE_READ)) {
    return appRoutes.maintenanceDashboard;
  }

  if (permissions.includes(permissionCodes.CONTRACTS_READ)) {
    return appRoutes.contracts;
  }

  if (permissions.includes(permissionCodes.CONTACTS_READ)) {
    return appRoutes.contacts;
  }

  if (permissions.includes(permissionCodes.PROPERTIES_READ)) {
    return appRoutes.properties;
  }

  if (permissions.includes(permissionCodes.PREFERENCES_MANAGE)) {
    return appRoutes.settings;
  }

  return appRoutes.forbidden;
}
