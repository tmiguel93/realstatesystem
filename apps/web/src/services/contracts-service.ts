import { api } from "@/lib/api";
import type {
  ContractDetail,
  LeaseTerminationRule,
  LeaseTerminationSimulation,
  PaginatedContracts,
  TenantMagicLinkManagement,
} from "@/types/domain";

type ContractPayload = {
  code?: string | null;
  originType: string;
  rentLeadId?: string | null;
  propertyId?: string | null;
  tenantId?: string | null;
  startDate: string;
  endDate: string;
  rentAmount: number;
  dueDay: number;
  guaranteeType: string;
  guaranteeDetails?: string | null;
  adjustmentIndex: string;
  adjustmentFrequencyMonths: number;
  lateFeePercentage?: number | null;
  penaltyDescription?: string | null;
  responsibilities: string[];
  additionalClauses?: string | null;
  checklistItems: Array<{
    itemType: string;
    status: string;
    isRequired: boolean;
    responsibleUserId?: string | null;
    completedAt?: string | null;
    notes?: string | null;
    attachmentFileUrl?: string | null;
  }>;
  checklistOverrideReason?: string | null;
  legalWarningAcknowledged: boolean;
};

type ContractListQuery = {
  accessToken: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  propertyId?: string;
  ownerId?: string;
  tenantId?: string;
  rentLeadId?: string;
  onlyExpiring?: boolean;
};

type LeaseTerminationLineItem = {
  label: string;
  amount: number;
};

const authHeader = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

export const contractsService = {
  async list(query: ContractListQuery) {
    const { accessToken, ...params } = query;
    const { data } = await api.get<PaginatedContracts>("/contracts", {
      ...authHeader(accessToken),
      params,
    });

    return data;
  },

  async getById(accessToken: string, id: string) {
    const { data } = await api.get<ContractDetail>(
      `/contracts/${id}`,
      authHeader(accessToken),
    );
    return data;
  },

  async getTenantMagicLink(accessToken: string, contractId: string) {
    const { data } = await api.get<TenantMagicLinkManagement>(
      `/contracts/${contractId}/tenant-magic-link`,
      authHeader(accessToken),
    );
    return data;
  },

  async generateTenantMagicLink(
    accessToken: string,
    contractId: string,
    payload: { expiresInDays: number },
  ) {
    const { data } = await api.post<TenantMagicLinkManagement>(
      `/contracts/${contractId}/tenant-magic-link`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },

  async revokeTenantMagicLink(accessToken: string, contractId: string) {
    const { data } = await api.post(
      `/contracts/${contractId}/tenant-magic-link/revoke`,
      {},
      authHeader(accessToken),
    );
    return data as { revoked: boolean; revokedAt: string };
  },

  async create(accessToken: string, payload: ContractPayload) {
    const { data } = await api.post(
      "/contracts",
      payload,
      authHeader(accessToken),
    );
    return data as ContractDetail;
  },

  async createVersion(accessToken: string, id: string, payload: ContractPayload) {
    const { data } = await api.post(
      `/contracts/${id}/versions`,
      payload,
      authHeader(accessToken),
    );
    return data as ContractDetail;
  },

  async reviewVersion(
    accessToken: string,
    contractId: string,
    versionId: string,
    status: "REVIEWED" | "FINALIZED",
  ) {
    const { data } = await api.post(
      `/contracts/${contractId}/versions/${versionId}/review`,
      { status },
      authHeader(accessToken),
    );
    return data as ContractDetail;
  },

  async updateStatus(
    accessToken: string,
    contractId: string,
    payload: {
      status: "ACTIVE" | "TERMINATED" | "CANCELLED" | "EXPIRED" | "RENEWED";
      terminationReason?: string | null;
    },
  ) {
    const { data } = await api.patch(
      `/contracts/${contractId}/status`,
      payload,
      authHeader(accessToken),
    );
    return data as ContractDetail;
  },

  async downloadPdf(
    accessToken: string,
    contractId: string,
    versionId: string,
    fileName: string,
  ) {
    const response = await api.get<Blob>(
      `/contracts/${contractId}/versions/${versionId}/pdf`,
      {
        ...authHeader(accessToken),
        responseType: "blob",
      },
    );

    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  },

  async listTerminationRules(accessToken: string) {
    const { data } = await api.get<LeaseTerminationRule[]>(
      "/contracts/termination/rules",
      authHeader(accessToken),
    );
    return data;
  },

  async saveTerminationRule(
    accessToken: string,
    payload: {
      id?: string;
      name: string;
      penaltyPercentage: number;
      proportionalByRemainingTime: boolean;
      allowManualAdjustments: boolean;
      additionalCharges: LeaseTerminationLineItem[];
      discounts: LeaseTerminationLineItem[];
      formulaDescription: string;
      standardNotes?: string | null;
      legalSupportText?: string | null;
      active: boolean;
    },
  ) {
    const { data } = await api.post(
      "/contracts/termination/rules",
      payload,
      authHeader(accessToken),
    );
    return data as LeaseTerminationRule[];
  },

  async simulateTermination(
    accessToken: string,
    contractId: string,
    payload: {
      ruleId?: string | null;
      manualPenaltyPercentage?: number | null;
      additionalCharges: LeaseTerminationLineItem[];
      discounts: LeaseTerminationLineItem[];
      reason?: string | null;
      notes?: string | null;
    },
  ) {
    const { data } = await api.post<LeaseTerminationSimulation>(
      `/contracts/${contractId}/termination/simulate`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },

  async confirmTermination(
    accessToken: string,
    contractId: string,
    payload: {
      simulationId: string;
      reason: string;
      finalNotes?: string | null;
    },
  ) {
    const { data } = await api.post(
      `/contracts/${contractId}/termination/confirm`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },
};
