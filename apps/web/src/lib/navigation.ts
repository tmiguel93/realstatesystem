import { appRoutes, permissionCodes, roleCodes } from "@imobiliaria/shared";

function hasPermission(permissions: string[], permission: string) {
  return permissions.includes(permission);
}

function hasRole(roles: string[], role: string) {
  return roles.includes(role);
}

export function resolveHomeRoute(permissions: string[], roles: string[] = []) {
  if (
    hasRole(roles, roleCodes.MASTER_ADMIN) &&
    hasPermission(permissions, permissionCodes.DASHBOARD_READ)
  ) {
    return appRoutes.dashboard;
  }

  if (
    hasRole(roles, roleCodes.USER_OPERACIONAL) &&
    hasPermission(permissions, permissionCodes.DASHBOARD_READ)
  ) {
    return appRoutes.dashboard;
  }

  if (
    hasRole(roles, roleCodes.TENANT_PORTAL) &&
    hasPermission(permissions, permissionCodes.TENANT_PORTAL_ACCESS)
  ) {
    return appRoutes.tenantPortal;
  }

  if (
    hasRole(roles, roleCodes.MAINTENANCE_TEAM) &&
    hasPermission(permissions, permissionCodes.MAINTENANCE_READ)
  ) {
    return appRoutes.maintenanceTickets;
  }

  if (
    hasRole(roles, roleCodes.RENT_ATTENDANT) &&
    hasPermission(permissions, permissionCodes.RENT_LEADS_READ)
  ) {
    return appRoutes.rents;
  }

  if (
    hasRole(roles, roleCodes.BROKER) &&
    hasPermission(permissions, permissionCodes.PROPERTIES_READ)
  ) {
    return appRoutes.properties;
  }

  if (hasPermission(permissions, permissionCodes.MAINTENANCE_READ)) {
    return appRoutes.maintenanceTickets;
  }

  if (hasPermission(permissions, permissionCodes.CONTRACTS_READ)) {
    return appRoutes.contracts;
  }

  if (hasPermission(permissions, permissionCodes.CONTACTS_READ)) {
    return appRoutes.contacts;
  }

  if (hasPermission(permissions, permissionCodes.PROPERTIES_READ)) {
    return appRoutes.properties;
  }

  if (hasPermission(permissions, permissionCodes.PREFERENCES_MANAGE)) {
    return appRoutes.settings;
  }

  return appRoutes.forbidden;
}
