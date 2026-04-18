import { NavLink } from "react-router-dom";
import { appRoutes, permissionCodes } from "@imobiliaria/shared";
import {
  Building2,
  CalendarCheck2,
  FileText,
  FileSpreadsheet,
  HandCoins,
  Home,
  KeyRound,
  LayoutDashboard,
  Settings,
  UserCog,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/auth-context";

const items = [
  {
    label: "Dashboard",
    to: appRoutes.dashboard,
    icon: LayoutDashboard,
    permission: permissionCodes.DASHBOARD_READ,
  },
  {
    label: "Imoveis",
    to: appRoutes.properties,
    icon: Home,
    permission: permissionCodes.PROPERTIES_READ,
  },
  {
    label: "Proprietarios",
    to: appRoutes.owners,
    icon: Building2,
    permission: permissionCodes.OWNERS_READ,
  },
  {
    label: "Locatarios",
    to: appRoutes.tenants,
    icon: Users,
    permission: permissionCodes.TENANTS_READ,
  },
  {
    label: "Vendas",
    to: appRoutes.sales,
    icon: HandCoins,
    permission: permissionCodes.SALE_LEADS_READ,
  },
  {
    label: "Locacao",
    to: appRoutes.rents,
    icon: FileSpreadsheet,
    permission: permissionCodes.RENT_LEADS_READ,
  },
  {
    label: "Visitas",
    to: appRoutes.visits,
    icon: CalendarCheck2,
    permission: permissionCodes.VISITS_READ,
  },
  {
    label: "Chaves",
    to: appRoutes.keys,
    icon: KeyRound,
    permission: permissionCodes.KEYS_READ,
  },
  {
    label: "Contratos",
    to: appRoutes.contracts,
    icon: FileText,
    permission: permissionCodes.CONTRACTS_READ,
  },
  {
    label: "Usuarios",
    to: appRoutes.users,
    icon: UserCog,
    permission: permissionCodes.USERS_MANAGE,
  },
  {
    label: "Configuracoes",
    to: appRoutes.settings,
    icon: Settings,
    permission: permissionCodes.SETTINGS_MANAGE,
  },
];

export function SidebarNav() {
  const { hasPermission } = useAuth();

  return (
    <nav className="space-y-2">
      {items
        .filter((item) => hasPermission(item.permission))
        .map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all duration-200",
                  isActive
                    ? "border-brand-300/40 bg-white/10 text-white shadow-soft"
                    : "border-transparent text-white/68 hover:border-white/10 hover:bg-white/6 hover:text-white",
                )
              }
            >
              <span className="grid size-9 place-items-center rounded-xl bg-white/8 text-white/90 transition-colors group-hover:bg-white/12">
                <Icon size={18} />
              </span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
    </nav>
  );
}
