export const roleCodes = {
  MASTER_ADMIN: "MASTER_ADMIN",
  USER_OPERACIONAL: "USER_OPERACIONAL",
  BROKER: "BROKER",
  RENT_ATTENDANT: "RENT_ATTENDANT",
  MAINTENANCE_TEAM: "MAINTENANCE_TEAM",
  TENANT_PORTAL: "TENANT_PORTAL",
} as const;

export type RoleCode = (typeof roleCodes)[keyof typeof roleCodes];

export const permissionCodes = {
  DASHBOARD_READ: "dashboard.read",
  REPORTS_READ: "reports.read",
  USERS_MANAGE: "users.manage",
  ACCESS_MANAGE: "access.manage",
  SETTINGS_MANAGE: "settings.manage",
  PREFERENCES_MANAGE: "preferences.manage",
  OWNERS_READ: "owners.read",
  OWNERS_WRITE: "owners.write",
  TENANTS_READ: "tenants.read",
  TENANTS_WRITE: "tenants.write",
  PROPERTIES_READ: "properties.read",
  PROPERTIES_WRITE: "properties.write",
  PROPERTY_IMAGES_READ: "propertyImages.read",
  PROPERTY_IMAGES_WRITE: "propertyImages.write",
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
  LEASE_TERMINATION_RULES_MANAGE: "leaseTermination.rules.manage",
  LEASE_TERMINATION_SIMULATE: "leaseTermination.simulate",
  LEASE_TERMINATION_EXECUTE: "leaseTermination.execute",
  MAINTENANCE_READ: "maintenance.read",
  MAINTENANCE_WRITE: "maintenance.write",
  MAINTENANCE_OVERRIDE: "maintenance.override",
  MAINTENANCE_PORTAL_OPEN: "maintenance.portal.open",
  TENANT_PORTAL_ACCESS: "tenantPortal.access",
  AUDIT_READ: "audit.read",
} as const;

export type PermissionCode =
  (typeof permissionCodes)[keyof typeof permissionCodes];

export const allPermissions = Object.values(permissionCodes);

export const operationalPermissions: PermissionCode[] = [
  permissionCodes.DASHBOARD_READ,
  permissionCodes.PREFERENCES_MANAGE,
  permissionCodes.OWNERS_READ,
  permissionCodes.OWNERS_WRITE,
  permissionCodes.TENANTS_READ,
  permissionCodes.TENANTS_WRITE,
  permissionCodes.PROPERTIES_READ,
  permissionCodes.PROPERTIES_WRITE,
  permissionCodes.PROPERTY_IMAGES_READ,
  permissionCodes.PROPERTY_IMAGES_WRITE,
  permissionCodes.SALE_LEADS_READ,
  permissionCodes.SALE_LEADS_WRITE,
  permissionCodes.RENT_LEADS_READ,
  permissionCodes.RENT_LEADS_WRITE,
  permissionCodes.VISITS_READ,
  permissionCodes.VISITS_WRITE,
  permissionCodes.KEYS_READ,
  permissionCodes.KEYS_WRITE,
  permissionCodes.CONTRACTS_READ,
  permissionCodes.MAINTENANCE_READ,
  permissionCodes.MAINTENANCE_WRITE,
];

export const brokerPermissions: PermissionCode[] = [
  permissionCodes.PREFERENCES_MANAGE,
  permissionCodes.PROPERTIES_READ,
  permissionCodes.PROPERTY_IMAGES_READ,
  permissionCodes.OWNERS_READ,
  permissionCodes.SALE_LEADS_READ,
  permissionCodes.SALE_LEADS_WRITE,
  permissionCodes.RENT_LEADS_READ,
  permissionCodes.RENT_LEADS_WRITE,
  permissionCodes.VISITS_READ,
  permissionCodes.VISITS_WRITE,
];

export const rentAttendantPermissions: PermissionCode[] = [
  permissionCodes.PREFERENCES_MANAGE,
  permissionCodes.OWNERS_READ,
  permissionCodes.OWNERS_WRITE,
  permissionCodes.TENANTS_READ,
  permissionCodes.TENANTS_WRITE,
  permissionCodes.PROPERTIES_READ,
  permissionCodes.PROPERTIES_WRITE,
  permissionCodes.PROPERTY_IMAGES_READ,
  permissionCodes.PROPERTY_IMAGES_WRITE,
  permissionCodes.RENT_LEADS_READ,
  permissionCodes.RENT_LEADS_WRITE,
  permissionCodes.VISITS_READ,
  permissionCodes.VISITS_WRITE,
  permissionCodes.KEYS_READ,
  permissionCodes.KEYS_WRITE,
  permissionCodes.CONTRACTS_READ,
  permissionCodes.CONTRACTS_GENERATE,
  permissionCodes.MAINTENANCE_READ,
  permissionCodes.MAINTENANCE_WRITE,
];

export const maintenanceTeamPermissions: PermissionCode[] = [
  permissionCodes.PREFERENCES_MANAGE,
  permissionCodes.OWNERS_READ,
  permissionCodes.TENANTS_READ,
  permissionCodes.PROPERTIES_READ,
  permissionCodes.PROPERTY_IMAGES_READ,
  permissionCodes.CONTRACTS_READ,
  permissionCodes.LEASE_TERMINATION_SIMULATE,
  permissionCodes.LEASE_TERMINATION_EXECUTE,
  permissionCodes.MAINTENANCE_READ,
  permissionCodes.MAINTENANCE_WRITE,
  permissionCodes.MAINTENANCE_OVERRIDE,
];

export const tenantPortalPermissions: PermissionCode[] = [
  permissionCodes.PREFERENCES_MANAGE,
  permissionCodes.TENANT_PORTAL_ACCESS,
  permissionCodes.MAINTENANCE_PORTAL_OPEN,
];

export const rolePermissionMap: Record<RoleCode, PermissionCode[]> = {
  [roleCodes.MASTER_ADMIN]: allPermissions,
  [roleCodes.USER_OPERACIONAL]: operationalPermissions,
  [roleCodes.BROKER]: brokerPermissions,
  [roleCodes.RENT_ATTENDANT]: rentAttendantPermissions,
  [roleCodes.MAINTENANCE_TEAM]: maintenanceTeamPermissions,
  [roleCodes.TENANT_PORTAL]: tenantPortalPermissions,
};
