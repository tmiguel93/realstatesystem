import type { ReactNode } from "react";
import { appRoutes, permissionCodes } from "@imobiliaria/shared";
import { motion } from "framer-motion";
import {
  CalendarClock,
  FileWarning,
  KeyRound,
  PhoneCall,
  Siren,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SkeletonCard } from "@/components/feedback/skeleton-card";
import { useAuth } from "@/features/auth/auth-context";
import { useI18n } from "@/features/preferences/language-provider";
import type {
  DashboardDailyRoutine,
  DashboardRoutineAlert,
} from "@/services/dashboard-service";

type DailyRoutinePanelProps = {
  routine?: DashboardDailyRoutine;
  isLoading: boolean;
  isError: boolean;
};

type RoutineItem = {
  key: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string | null;
  count: number;
  alert: DashboardRoutineAlert;
  icon: ReactNode;
};

const alertToneClass: Record<Exclude<DashboardRoutineAlert, null>, string> = {
  OVERDUE:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
  DUE_TODAY:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
  URGENT:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
  UNASSIGNED:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
};

const accentToneClass: Record<Exclude<DashboardRoutineAlert, null>, string> = {
  OVERDUE: "from-red-500 to-rose-600",
  DUE_TODAY: "from-sky-500 to-brand-500",
  URGENT: "from-rose-500 to-red-700",
  UNASSIGNED: "from-amber-400 to-sand-600",
};

function getAlertLabel(
  alert: DashboardRoutineAlert,
  t: (key: string) => string,
) {
  if (!alert) {
    return t("dashboard.dailyRoutine.alerts.noAlert");
  }

  return t(`dashboard.dailyRoutine.alerts.${alert}`);
}

function getAlertClass(alert: DashboardRoutineAlert) {
  if (!alert) {
    return "border-ink-200 bg-ink-50 text-ink-500 dark:border-ink-200/20 dark:bg-ink-100/20 dark:text-ink-600";
  }

  return alertToneClass[alert];
}

function getAccentClass(alert: DashboardRoutineAlert) {
  if (!alert) {
    return "from-brand-300 to-ink-300";
  }

  return accentToneClass[alert];
}

export function DailyRoutinePanel({
  routine,
  isLoading,
  isError,
}: DailyRoutinePanelProps) {
  const { hasPermission } = useAuth();
  const { locale, t } = useI18n();
  const localeCode = locale === "PT_BR" ? "pt-BR" : locale.toLowerCase();
  const canOpenVisits = hasPermission(permissionCodes.VISITS_READ);
  const canOpenKeys = hasPermission(permissionCodes.KEYS_READ);
  const canOpenContracts = hasPermission(permissionCodes.CONTRACTS_READ);
  const canOpenMaintenance = hasPermission(permissionCodes.MAINTENANCE_READ);
  const canOpenSales = hasPermission(permissionCodes.SALE_LEADS_READ);
  const canOpenRents = hasPermission(permissionCodes.RENT_LEADS_READ);
  const preferredLeadRoute =
    routine &&
    routine.leadsWithoutReturn.rentCount > routine.leadsWithoutReturn.saleCount
      ? appRoutes.rents
      : appRoutes.sales;
  const fallbackLeadRoute = canOpenSales
    ? appRoutes.sales
    : canOpenRents
      ? appRoutes.rents
      : null;
  const leadRoute =
    preferredLeadRoute === appRoutes.rents && canOpenRents
      ? appRoutes.rents
      : preferredLeadRoute === appRoutes.sales && canOpenSales
        ? appRoutes.sales
        : fallbackLeadRoute;

  const items: RoutineItem[] = routine
    ? [
        {
          key: "visits",
          title: t("dashboard.dailyRoutine.items.visits.title"),
          description: t("dashboard.dailyRoutine.items.visits.description", {
            overdue: routine.visitsToday.overdueCount,
          }),
          actionLabel: t("dashboard.dailyRoutine.items.visits.action"),
          href: canOpenVisits ? appRoutes.visits : null,
          count: routine.visitsToday.count,
          alert: routine.visitsToday.alert,
          icon: <CalendarClock size={20} />,
        },
        {
          key: "keys",
          title: t("dashboard.dailyRoutine.items.keys.title"),
          description: t("dashboard.dailyRoutine.items.keys.description", {
            overdue: routine.checkedOutKeys.overdueCount,
            unassigned: routine.checkedOutKeys.unassignedCount,
          }),
          actionLabel: t("dashboard.dailyRoutine.items.keys.action"),
          href: canOpenKeys ? appRoutes.keys : null,
          count: routine.checkedOutKeys.count,
          alert: routine.checkedOutKeys.alert,
          icon: <KeyRound size={20} />,
        },
        {
          key: "contracts",
          title: t("dashboard.dailyRoutine.items.contracts.title"),
          description: t("dashboard.dailyRoutine.items.contracts.description", {
            dueToday: routine.expiringContracts.dueTodayCount,
            overdue: routine.expiringContracts.overdueCount,
            days: routine.expiringContracts.windowDays,
          }),
          actionLabel: t("dashboard.dailyRoutine.items.contracts.action"),
          href: canOpenContracts ? appRoutes.contracts : null,
          count: routine.expiringContracts.count,
          alert: routine.expiringContracts.alert,
          icon: <FileWarning size={20} />,
        },
        {
          key: "maintenance",
          title: t("dashboard.dailyRoutine.items.maintenance.title"),
          description: t(
            "dashboard.dailyRoutine.items.maintenance.description",
            {
              urgent: routine.criticalMaintenanceTickets.urgentCount,
              overdue: routine.criticalMaintenanceTickets.overdueCount,
              unassigned: routine.criticalMaintenanceTickets.unassignedCount,
            },
          ),
          actionLabel: t("dashboard.dailyRoutine.items.maintenance.action"),
          href: canOpenMaintenance ? appRoutes.maintenanceTickets : null,
          count: routine.criticalMaintenanceTickets.count,
          alert: routine.criticalMaintenanceTickets.alert,
          icon: <Siren size={20} />,
        },
        {
          key: "leads",
          title: t("dashboard.dailyRoutine.items.leads.title"),
          description: t("dashboard.dailyRoutine.items.leads.description", {
            overdue: routine.leadsWithoutReturn.overdueCount,
            dueToday: routine.leadsWithoutReturn.dueTodayCount,
            sales: routine.leadsWithoutReturn.saleCount,
            rents: routine.leadsWithoutReturn.rentCount,
          }),
          actionLabel: t("dashboard.dailyRoutine.items.leads.action"),
          href: leadRoute,
          count: routine.leadsWithoutReturn.count,
          alert: routine.leadsWithoutReturn.alert,
          icon: <PhoneCall size={20} />,
        },
      ]
    : [];

  return (
    <section className="panel-card overflow-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-brand-600">
            {t("dashboard.dailyRoutine.eyebrow")}
          </p>
          <h2 className="mt-3 font-display text-2xl text-ink-950">
            {t("dashboard.dailyRoutine.title")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-ink-500">
            {t("dashboard.dailyRoutine.description")}
          </p>
        </div>

        {routine ? (
          <p className="rounded-2xl border border-ink-200/70 bg-ink-50/70 px-4 py-2 text-xs font-semibold text-ink-500 dark:border-ink-200/20 dark:bg-ink-100/10 dark:text-ink-600">
            {t("dashboard.dailyRoutine.refreshedAt", {
              time: new Intl.DateTimeFormat(localeCode, {
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(routine.refreshedAt)),
            })}
          </p>
        ) : null}
      </div>

      {isError ? (
        <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50/80 px-5 py-4 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {t("dashboard.dailyRoutine.unavailable")}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))
          : items.map((item, index) => (
              <motion.article
                key={item.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.24,
                  delay: index * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group relative overflow-hidden rounded-[28px] border border-[var(--field-border)] bg-[var(--panel-bg-muted)] p-5 shadow-[0_18px_45px_-34px_rgba(24,57,48,0.36)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_48px_-32px_rgba(24,57,48,0.46)]"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${getAccentClass(
                    item.alert,
                  )}`}
                />

                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-ink-950 to-brand-700 text-white shadow-[0_16px_30px_-22px_rgba(24,57,48,0.7)]">
                    {item.icon}
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getAlertClass(
                      item.alert,
                    )}`}
                  >
                    {getAlertLabel(item.alert, t)}
                  </span>
                </div>

                <p className="mt-5 text-sm font-semibold text-ink-700">
                  {item.title}
                </p>
                <p className="mt-2 font-display text-4xl text-ink-950">
                  {item.count}
                </p>
                <p className="mt-3 min-h-[60px] text-sm leading-6 text-ink-500">
                  {item.description}
                </p>

                {item.href ? (
                  <Link
                    to={item.href}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-ink-200/70 bg-white/70 px-4 py-3 text-sm font-semibold text-ink-700 transition duration-200 hover:border-brand-300 hover:text-ink-950 dark:border-ink-200/20 dark:bg-ink-100/10 dark:text-ink-700 dark:hover:text-ink-950"
                  >
                    {item.actionLabel}
                  </Link>
                ) : (
                  <span className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-ink-200/60 bg-ink-50/60 px-4 py-3 text-sm font-semibold text-ink-400 dark:border-ink-200/10 dark:bg-ink-100/10 dark:text-ink-500">
                    {t("dashboard.dailyRoutine.noPermissionAction")}
                  </span>
                )}
              </motion.article>
            ))}
      </div>
    </section>
  );
}
