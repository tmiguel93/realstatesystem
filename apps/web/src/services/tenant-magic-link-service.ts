import { api } from "@/lib/api";
import type { TenantMagicLinkOverview } from "@/types/domain";

const tokenHeader = (token: string) => ({
  headers: {
    "X-Tenant-Link-Token": token,
  },
});

export const tenantMagicLinkService = {
  async getOverview(token: string) {
    const { data } = await api.get<TenantMagicLinkOverview>(
      "/tenant-magic-links/overview",
      tokenHeader(token),
    );
    return data;
  },

  async openMaintenanceTicket(
    token: string,
    payload: {
      type: string;
      description: string;
      complementaryNotes?: string | null;
      files: File[];
    },
  ) {
    const formData = new FormData();
    formData.append("type", payload.type);
    formData.append("description", payload.description);

    if (payload.complementaryNotes) {
      formData.append("complementaryNotes", payload.complementaryNotes);
    }

    payload.files.forEach((file) => {
      formData.append("files", file);
    });

    const { data } = await api.post(
      "/tenant-magic-links/maintenance-tickets",
      formData,
      {
        headers: {
          "X-Tenant-Link-Token": token,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data;
  },
};
