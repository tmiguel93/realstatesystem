import { NavLink } from "react-router-dom";
import { appRoutes } from "@imobiliaria/shared";
import { cn } from "@/lib/cn";

const items = [
  {
    label: "Dashboard",
    to: appRoutes.maintenanceDashboard,
  },
  {
    label: "Lista",
    to: appRoutes.maintenanceTickets,
  },
  {
    label: "Kanban",
    to: appRoutes.maintenanceKanban,
  },
  {
    label: "Abrir chamado",
    to: appRoutes.maintenanceTicketNew,
  },
];

export function MaintenanceModuleNav() {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to}>
          {({ isActive }) => (
            <span
              className={cn(
                "inline-flex items-center rounded-2xl border px-4 py-2.5 text-sm font-semibold transition duration-200",
                isActive
                  ? "border-ink-950 bg-ink-950 text-white shadow-[0_18px_34px_-24px_rgba(24,57,48,0.52)]"
                  : "border-ink-200 bg-white/88 text-ink-700 hover:border-brand-200 hover:text-ink-950",
              )}
            >
              {item.label}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
}
