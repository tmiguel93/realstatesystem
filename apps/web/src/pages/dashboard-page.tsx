import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarClock,
  FileText,
  KeyRound,
  Landmark,
  UserRoundCheck,
} from "lucide-react";
import { SkeletonCard } from "@/components/feedback/skeleton-card";
import { StatCard } from "@/components/feedback/stat-card";
import { useAuth } from "@/features/auth/auth-context";
import { DailyRoutinePanel } from "@/features/dashboard/daily-routine-panel";
import { useI18n } from "@/features/preferences/language-provider";
import { dashboardService } from "@/services/dashboard-service";

export function DashboardPage() {
  const { accessToken } = useAuth();
  const { t, message } = useI18n();

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => dashboardService.summary(accessToken!),
    enabled: Boolean(accessToken),
  });

  const dailyRoutineQuery = useQuery({
    queryKey: ["dashboard-daily-routine"],
    queryFn: () => dashboardService.dailyRoutine(accessToken!),
    enabled: Boolean(accessToken),
  });

  const statItems = summaryQuery.data
    ? [
        {
          label: t("dashboard.stats.availableProperties"),
          value: summaryQuery.data.availableProperties,
          detail: t("dashboard.statsDetails.availableProperties"),
          icon: <Building2 size={20} />,
        },
        {
          label: t("dashboard.stats.visitsToday"),
          value: summaryQuery.data.visitsToday,
          detail: t("dashboard.statsDetails.visitsToday"),
          icon: <CalendarClock size={20} />,
        },
        {
          label: t("dashboard.stats.activeContracts"),
          value: summaryQuery.data.activeContracts,
          detail: t("dashboard.statsDetails.activeContracts"),
          icon: <FileText size={20} />,
        },
        {
          label: t("dashboard.stats.checkedOutKeys"),
          value: summaryQuery.data.checkedOutKeys,
          detail: t("dashboard.statsDetails.checkedOutKeys"),
          icon: <KeyRound size={20} />,
        },
        {
          label: t("dashboard.stats.openSaleLeads"),
          value: summaryQuery.data.openSaleLeads,
          detail: t("dashboard.statsDetails.openSaleLeads"),
          icon: <Landmark size={20} />,
        },
        {
          label: t("dashboard.stats.openRentLeads"),
          value: summaryQuery.data.openRentLeads,
          detail: t("dashboard.statsDetails.openRentLeads"),
          icon: <UserRoundCheck size={20} />,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <DailyRoutinePanel
        routine={dailyRoutineQuery.data}
        isLoading={dailyRoutineQuery.isLoading}
        isError={dailyRoutineQuery.isError}
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {summaryQuery.isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))
          : statItems.map((item) => <StatCard key={item.label} {...item} />)}
      </section>

      <section>
        <article className="panel-card">
          <p className="text-xs uppercase tracking-[0.28em] text-brand-600">
            {t("dashboard.prioritiesTitle")}
          </p>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {message<string[]>("dashboard.priorities").map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(251,248,243,0.88))] px-4 py-4 text-sm text-ink-600 shadow-[0_16px_34px_-28px_rgba(24,57,48,0.32)]"
              >
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
