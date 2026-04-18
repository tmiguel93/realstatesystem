import { api } from "@/lib/api";

export type DashboardSummary = {
  availableProperties: number;
  visitsToday: number;
  activeContracts: number;
  checkedOutKeys: number;
  openSaleLeads: number;
  openRentLeads: number;
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
};

