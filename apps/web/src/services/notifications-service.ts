import { api } from "@/lib/api";
import type { AppNotificationsResponse } from "@/types/domain";

const authHeader = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

export const notificationsService = {
  async list(accessToken: string, limit = 8) {
    const { data } = await api.get<AppNotificationsResponse>("/notifications", {
      ...authHeader(accessToken),
      params: { limit },
    });
    return data;
  },

  async markAsRead(accessToken: string, id: string) {
    const { data } = await api.patch(
      `/notifications/${id}/read`,
      {},
      authHeader(accessToken),
    );
    return data;
  },
};
