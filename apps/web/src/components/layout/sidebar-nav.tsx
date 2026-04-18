import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { appRoutes, permissionCodes } from "@imobiliaria/shared";
import {
  Building2,
  CalendarCheck2,
  FileSpreadsheet,
  FileText,
  HandCoins,
  Home,
  KeyRound,
  LayoutDashboard,
  Settings,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/auth-context";

const items = [
  {
    section: "Visao",
    label: "Dashboard",
    to: appRoutes.dashboard,
    icon: LayoutDashboard,
    permission: permissionCodes.DASHBOARD_READ,
  },
  {
    section: "Cadastros",
    label: "Imoveis",
    to: appRoutes.properties,
    icon: Home,
    permission: permissionCodes.PROPERTIES_READ,
  },
  {
    section: "Cadastros",
    label: "Proprietarios",
    to: appRoutes.owners,
    icon: Building2,
    permission: permissionCodes.OWNERS_READ,
  },
  {
    section: "Cadastros",
    label: "Locatarios",
    to: appRoutes.tenants,
    icon: Users,
    permission: permissionCodes.TENANTS_READ,
  },
  {
    section: "Operacao",
    label: "Vendas",
    to: appRoutes.sales,
    icon: HandCoins,
    permission: permissionCodes.SALE_LEADS_READ,
  },
  {
    section: "Operacao",
    label: "Locacao",
    to: appRoutes.rents,
    icon: FileSpreadsheet,
    permission: permissionCodes.RENT_LEADS_READ,
  },
  {
    section: "Operacao",
    label: "Visitas",
    to: appRoutes.visits,
    icon: CalendarCheck2,
    permission: permissionCodes.VISITS_READ,
  },
  {
    section: "Operacao",
    label: "Chaves",
    to: appRoutes.keys,
    icon: KeyRound,
    permission: permissionCodes.KEYS_READ,
  },
  {
    section: "Operacao",
    label: "Manutencao",
    to: appRoutes.maintenanceDashboard,
    icon: Wrench,
    permission: permissionCodes.MAINTENANCE_READ,
  },
  {
    section: "Gestao",
    label: "Contratos",
    to: appRoutes.contracts,
    icon: FileText,
    permission: permissionCodes.CONTRACTS_READ,
  },
  {
    section: "Gestao",
    label: "Usuarios",
    to: appRoutes.users,
    icon: UserCog,
    permission: permissionCodes.USERS_MANAGE,
  },
  {
    section: "Gestao",
    label: "Configuracoes",
    to: appRoutes.settings,
    icon: Settings,
    permission: permissionCodes.SETTINGS_MANAGE,
  },
];

export function SidebarNav() {
  const { hasPermission } = useAuth();
  type NavItem = (typeof items)[number];

  const groupedItems = items
    .filter((item) => hasPermission(item.permission))
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
            {section}
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
                            : "border-transparent text-ink-700 hover:border-ink-200 hover:bg-white/88 hover:text-ink-950",
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
                            {item.label}
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
