export const roleCodes = {
  MASTER_ADMIN: "MASTER_ADMIN",
  USER_OPERACIONAL: "USER_OPERACIONAL",
} as const;

export type RoleCode = (typeof roleCodes)[keyof typeof roleCodes];

export const permissionCodes = {
  DASHBOARD_READ: "dashboard.read",
  REPORTS_READ: "reports.read",
  USERS_MANAGE: "users.manage",
  ACCESS_MANAGE: "access.manage",
  SETTINGS_MANAGE: "settings.manage",
  OWNERS_READ: "owners.read",
  OWNERS_WRITE: "owners.write",
  TENANTS_READ: "tenants.read",
  TENANTS_WRITE: "tenants.write",
  PROPERTIES_READ: "properties.read",
  PROPERTIES_WRITE: "properties.write",
  SALE_LEADS_READ: "saleLeads.read",
  SALE_LEADS_WRITE: "saleLeads.write",
  RENT_LEADS_READ: "rentLeads.read",
  RENT_LEADS_WRITE: "rentLeads.write",
  VISITS_READ: "visits.read",
  VISITS_WRITE: "visits.write",
  KEYS_READ: "keys.read",
  KEYS_WRITE: "keys.write",
  KEYS_OVERRIDE: "keys.override",
  CONTRACTS_READ: "contracts.read",
  CONTRACTS_GENERATE: "contracts.generate",
  CONTRACTS_REVIEW: "contracts.review",
  CONTRACTS_EXPORT: "contracts.export",
  AUDIT_READ: "audit.read",
} as const;

export type PermissionCode =
  (typeof permissionCodes)[keyof typeof permissionCodes];

export const allPermissions = Object.values(permissionCodes);

export const operationalPermissions: PermissionCode[] = [
  permissionCodes.DASHBOARD_READ,
  permissionCodes.OWNERS_READ,
  permissionCodes.OWNERS_WRITE,
  permissionCodes.TENANTS_READ,
  permissionCodes.TENANTS_WRITE,
  permissionCodes.PROPERTIES_READ,
  permissionCodes.PROPERTIES_WRITE,
  permissionCodes.SALE_LEADS_READ,
  permissionCodes.SALE_LEADS_WRITE,
  permissionCodes.RENT_LEADS_READ,
  permissionCodes.RENT_LEADS_WRITE,
  permissionCodes.VISITS_READ,
  permissionCodes.VISITS_WRITE,
  permissionCodes.KEYS_READ,
  permissionCodes.KEYS_WRITE,
  permissionCodes.CONTRACTS_READ,
];

export const rolePermissionMap: Record<RoleCode, PermissionCode[]> = {
  [roleCodes.MASTER_ADMIN]: allPermissions,
  [roleCodes.USER_OPERACIONAL]: operationalPermissions,
};

