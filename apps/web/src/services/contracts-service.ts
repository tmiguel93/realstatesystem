import { api } from "@/lib/api";
import type { ContractDetail, PaginatedContracts } from "@/types/domain";

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
};
