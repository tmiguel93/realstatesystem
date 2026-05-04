import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import {
  appRoutes,
  permissionCodes,
  roleCodes,
  type RoleCode,
} from "@imobiliaria/shared";
import {
  CalendarCheck2,
  FileSpreadsheet,
  FileText,
  HandCoins,
  Home,
  KeyRound,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { useI18n } from "@/features/preferences/language-provider";
import { cn } from "@/lib/cn";

const roleMenus: Record<RoleCode, string[]> = {
  [roleCodes.MASTER_ADMIN]: [
    "dashboard",
    "contacts",
    "properties",
    "sales",
    "rents",
    "visits",
    "keys",
    "maintenanceDashboard",
    "contracts",
    "users",
    "access",
    "settings",
  ],
  [roleCodes.USER_OPERACIONAL]: [
    "dashboard",
    "sales",
    "rents",
    "visits",
    "keys",
    "maintenanceTickets",
    "contracts",
    "properties",
    "contacts",
  ],
  [roleCodes.BROKER]: [
    "sales",
    "rents",
    "visits",
    "properties",
    "contacts",
  ],
  [roleCodes.RENT_ATTENDANT]: [
    "rents",
    "visits",
    "keys",
    "contracts",
    "maintenanceTickets",
    "properties",
    "contacts",
  ],
  [roleCodes.MAINTENANCE_TEAM]: [
    "maintenanceTickets",
    "properties",
    "contacts",
    "contracts",
  ],
  [roleCodes.TENANT_PORTAL]: ["tenantPortal"],
};

const items = [
  {
    id: "dashboard",
    section: "layout.sections.overview",
    label: "layout.menu.dashboard",
    to: appRoutes.dashboard,
    icon: LayoutDashboard,
    permission: permissionCodes.DASHBOARD_READ,
  },
  {
    id: "contacts",
    section: "layout.sections.registry",
    label: "layout.menu.contacts",
    to: appRoutes.contacts,
    icon: Users,
    permission: permissionCodes.CONTACTS_READ,
  },
  {
    id: "properties",
    section: "layout.sections.registry",
    label: "layout.menu.properties",
    to: appRoutes.properties,
    icon: Home,
    permission: permissionCodes.PROPERTIES_READ,
  },
  {
    id: "sales",
    section: "layout.sections.operation",
    label: "layout.menu.sales",
    to: appRoutes.sales,
    icon: HandCoins,
    permission: permissionCodes.SALE_LEADS_READ,
  },
  {
    id: "rents",
    section: "layout.sections.operation",
    label: "layout.menu.rents",
    to: appRoutes.rents,
    icon: FileSpreadsheet,
    permission: permissionCodes.RENT_LEADS_READ,
  },
  {
    id: "visits",
    section: "layout.sections.operation",
    label: "layout.menu.visits",
    to: appRoutes.visits,
    icon: CalendarCheck2,
    permission: permissionCodes.VISITS_READ,
  },
  {
    id: "keys",
    section: "layout.sections.operation",
    label: "layout.menu.keys",
    to: appRoutes.keys,
    icon: KeyRound,
    permission: permissionCodes.KEYS_READ,
  },
  {
    id: "maintenanceDashboard",
    section: "layout.sections.operation",
    label: "layout.menu.maintenance",
    to: appRoutes.maintenanceDashboard,
    icon: Wrench,
    permission: permissionCodes.MAINTENANCE_READ,
  },
  {
    id: "maintenanceTickets",
    section: "layout.sections.operation",
    label: "layout.menu.maintenanceTickets",
    to: appRoutes.maintenanceTickets,
    icon: Wrench,
    permission: permissionCodes.MAINTENANCE_READ,
  },
  {
    id: "contracts",
    section: "layout.sections.management",
    label: "layout.menu.contracts",
    to: appRoutes.contracts,
    icon: FileText,
    permission: permissionCodes.CONTRACTS_READ,
  },
  {
    id: "users",
    section: "layout.sections.management",
    label: "layout.menu.users",
    to: appRoutes.users,
    icon: UserCog,
    permission: permissionCodes.USERS_MANAGE,
  },
  {
    id: "access",
    section: "layout.sections.management",
    label: "layout.menu.access",
    to: appRoutes.accessManagement,
    icon: ShieldCheck,
    permission: permissionCodes.ACCESS_MANAGE,
  },
  {
    id: "settings",
    section: "layout.sections.management",
    label: "layout.menu.settings",
    to: appRoutes.settings,
    icon: Settings,
    permission: permissionCodes.PREFERENCES_MANAGE,
  },
  {
    id: "tenantPortal",
    section: "layout.sections.tenant",
    label: "layout.menu.tenantPortal",
    to: appRoutes.tenantPortal,
    icon: Wrench,
    permission: permissionCodes.TENANT_PORTAL_ACCESS,
  },
] as const;

function resolveVisibleMenuIds(roles: string[]) {
  const normalizedRoles = roles.filter((role): role is RoleCode =>
    Object.values(roleCodes).includes(role as RoleCode),
  );

  if (normalizedRoles.includes(roleCodes.MASTER_ADMIN)) {
    return roleMenus[roleCodes.MASTER_ADMIN];
  }

  return Array.from(
    new Set(normalizedRoles.flatMap((role) => roleMenus[role] ?? [])),
  );
}

export function SidebarNav() {
  const { hasPermission, user } = useAuth();
  const { t } = useI18n();
  type NavItem = (typeof items)[number];
  const visibleMenuIds = resolveVisibleMenuIds(user?.roles ?? []);
  const visibleMenuOrder = new Map(
    visibleMenuIds.map((itemId, index) => [itemId, index]),
  );

  const groupedItems = items
    .filter((item) => visibleMenuOrder.has(item.id) && hasPermission(item.permission))
    .sort(
      (firstItem, secondItem) =>
        (visibleMenuOrder.get(firstItem.id) ?? 0) -
        (visibleMenuOrder.get(secondItem.id) ?? 0),
    )
    .reduce<Record<string, NavItem[]>>((acc, item) => {
      const sectionItems = acc[item.section] ?? [];
      sectionItems.push(item);
      acc[item.section] = sectionItems;
      return acc;
    }, {});

  return (
    <nav className="space-y-6">
      {Object.entries(groupedItems).map(([section, sectionItems], sectionIndex) => (
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.28,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.06 + sectionIndex * 0.05,
          }}
        >
          <p className="mb-3 px-3 text-[11px] uppercase tracking-[0.3em] text-ink-400">
            {t(section)}
          </p>

          <div className="space-y-2">
            {sectionItems.map((item, itemIndex) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.24,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.1 + itemIndex * 0.03,
                  }}
                >
                  <NavLink to={item.to}>
                    {({ isActive }) => (
                      <div
                        className={cn(
                          "group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all duration-200",
                          isActive
                            ? "border-ink-950 bg-ink-950 text-white shadow-[0_18px_38px_-26px_rgba(24,57,48,0.58)]"
                            : "border-transparent text-ink-700 hover:border-ink-200 hover:bg-white/10 hover:text-ink-950",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-9 place-items-center rounded-xl transition-all duration-200",
                            isActive
                              ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                              : "bg-ink-100 text-ink-700 group-hover:bg-brand-50 group-hover:text-brand-700",
                          )}
                        >
                          <Icon size={18} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-current">
                            {t(item.label)}
                          </p>
                        </div>
                      </div>
                    )}
                  </NavLink>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </nav>
  );
}
