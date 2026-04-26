import { api } from "@/lib/api";

export type DashboardSummary = {
  availableProperties: number;
  visitsToday: number;
  activeContracts: number;
  checkedOutKeys: number;
  openSaleLeads: number;
  openRentLeads: number;
};

export type DashboardRoutineAlert =
  | "OVERDUE"
  | "DUE_TODAY"
  | "URGENT"
  | "UNASSIGNED"
  | null;

export type DashboardRoutineMetric = {
  count: number;
  alert: DashboardRoutineAlert;
};

export type DashboardDailyRoutine = {
  refreshedAt: string;
  visitsToday: DashboardRoutineMetric & {
    overdueCount: number;
  };
  checkedOutKeys: DashboardRoutineMetric & {
    overdueCount: number;
    unassignedCount: number;
  };
  expiringContracts: DashboardRoutineMetric & {
    dueTodayCount: number;
    overdueCount: number;
    windowDays: number;
  };
  criticalMaintenanceTickets: DashboardRoutineMetric & {
    urgentCount: number;
    overdueCount: number;
    unassignedCount: number;
  };
  leadsWithoutReturn: DashboardRoutineMetric & {
    saleCount: number;
    rentCount: number;
    overdueCount: number;
    dueTodayCount: number;
    staleAfterDays: number;
  };
};

export const dashboardService = {
  async summary(accessToken: string) {
    const { data } = await api.get<DashboardSummary>("/dashboard/summary", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return data;
  },

  async dailyRoutine(accessToken: string) {
    const { data } = await api.get<DashboardDailyRoutine>(
      "/dashboard/daily-routine",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return data;
  },
};
