import { api } from "@/lib/api";
import type { TenantPortalOverview } from "@/types/domain";

const authHeader = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

export const tenantPortalService = {
  async getOverview(accessToken: string) {
    const { data } = await api.get<TenantPortalOverview>(
      "/tenant-portal/overview",
      authHeader(accessToken),
    );
    return data;
  },

  async openMaintenanceTicket(
    accessToken: string,
    payload: {
      propertyId: string;
      type: string;
      description: string;
      complementaryNotes?: string | null;
      files: File[];
    },
  ) {
    const formData = new FormData();
    formData.append("propertyId", payload.propertyId);
    formData.append("type", payload.type);
    formData.append("description", payload.description);

    if (payload.complementaryNotes) {
      formData.append("complementaryNotes", payload.complementaryNotes);
    }

    payload.files.forEach((file) => {
      formData.append("files", file);
    });

    const { data } = await api.post(
      "/tenant-portal/maintenance-tickets",
      formData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data;
  },
};
