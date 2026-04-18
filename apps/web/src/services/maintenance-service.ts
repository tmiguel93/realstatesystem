import { api } from "@/lib/api";
import type {
  MaintenanceDashboard,
  MaintenanceKanbanResponse,
  MaintenancePropertyContext,
  MaintenanceTicketDetail,
  PaginatedMaintenanceTickets,
} from "@/types/domain";

type MaintenanceAttachmentPayload = {
  name: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
};

export type MaintenanceTicketPayload = {
  propertyId: string;
  tenantId?: string | null;
  title: string;
  description: string;
  type: string;
  urgencyLevel?: number | null;
  assignedToUserId?: string | null;
  internalNotes?: string | null;
  attachments: MaintenanceAttachmentPayload[];
};

type MaintenanceTicketStatusPayload = {
  status: string;
  resolutionSummary?: string | null;
  cancelReason?: string | null;
  internalNotes?: string | null;
  assignedToUserId?: string | null;
};

type MaintenanceListQuery = {
  accessToken: string;
  page?: number;
  pageSize?: number;
  search?: string;
  propertyId?: string;
  status?: string;
  type?: string;
  urgencyLevel?: string;
  assignedToUserId?: string;
  openedByUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  onlyCritical?: string;
};

const authHeader = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

export const maintenanceService = {
  async list(query: MaintenanceListQuery) {
    const { accessToken, ...params } = query;
    const { data } = await api.get<PaginatedMaintenanceTickets>(
      "/maintenance-tickets",
      {
        ...authHeader(accessToken),
        params,
      },
    );
    return data;
  },

  async dashboard(accessToken: string) {
    const { data } = await api.get<MaintenanceDashboard>(
      "/maintenance-tickets/dashboard",
      authHeader(accessToken),
    );
    return data;
  },

  async kanban(query: Omit<MaintenanceListQuery, "page" | "pageSize">) {
    const { accessToken, ...params } = query;
    const { data } = await api.get<MaintenanceKanbanResponse>(
      "/maintenance-tickets/kanban",
      {
        ...authHeader(accessToken),
        params,
      },
    );
    return data;
  },

  async getById(accessToken: string, id: string) {
    const { data } = await api.get<MaintenanceTicketDetail>(
      `/maintenance-tickets/${id}`,
      authHeader(accessToken),
    );
    return data;
  },

  async getHistory(accessToken: string, id: string) {
    const { data } = await api.get<MaintenanceTicketDetail["history"]>(
      `/maintenance-tickets/${id}/history`,
      authHeader(accessToken),
    );
    return data;
  },

  async getPropertyContext(
    accessToken: string,
    query: { propertyId?: string; propertyCode?: string },
  ) {
    const { data } = await api.get<MaintenancePropertyContext>(
      "/maintenance-tickets/property-context",
      {
        ...authHeader(accessToken),
        params: query,
      },
    );
    return data;
  },

  async create(accessToken: string, payload: MaintenanceTicketPayload) {
    const { data } = await api.post(
      "/maintenance-tickets",
      payload,
      authHeader(accessToken),
    );
    return data;
  },

  async update(
    accessToken: string,
    id: string,
    payload: Partial<MaintenanceTicketPayload>,
  ) {
    const { data } = await api.patch(
      `/maintenance-tickets/${id}`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },

  async updateStatus(
    accessToken: string,
    id: string,
    payload: MaintenanceTicketStatusPayload,
  ) {
    const { data } = await api.patch(
      `/maintenance-tickets/${id}/status`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },
};
