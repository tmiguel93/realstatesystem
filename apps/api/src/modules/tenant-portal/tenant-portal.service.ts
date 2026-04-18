import {
  ContractStatus,
  MaintenanceTicketType,
  TenantPortalAccessStatus,
} from "@prisma/client";
import { maintenanceTicketTypeOptions } from "@imobiliaria/shared";
import { HttpError } from "../../core/http-error";
import { prisma } from "../../core/prisma";
import { MaintenanceService } from "../maintenance/maintenance.service";
import { requiresVisualEvidence } from "../maintenance/maintenance-severity-evaluator";

type RequestContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
  permissions?: string[];
  roles?: string[];
};

type AttachmentInput = {
  name: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
};

type OpenPortalTicketInput = {
  propertyId: string;
  type: MaintenanceTicketType;
  description: string;
  complementaryNotes?: string | null;
  attachments: AttachmentInput[];
};

const maintenanceService = new MaintenanceService();

function resolveTicketTypeLabel(type: MaintenanceTicketType) {
  return (
    maintenanceTicketTypeOptions.find((item) => item.value === type)?.label ??
    "Manutenção"
  );
}

export class TenantPortalService {
  async getOverview(context: RequestContext) {
    const access = await this.resolveActiveAccess(context.actorUserId);

    const activeContracts = await prisma.contract.findMany({
      where: {
        tenantId: access.tenantId,
        status: {
          in: [ContractStatus.ACTIVE, ContractStatus.RENEWED],
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        code: true,
        startDate: true,
        endDate: true,
        rentAmount: true,
        property: {
          select: {
            id: true,
            code: true,
            title: true,
            city: true,
            district: true,
            street: true,
            streetNumber: true,
            propertyImages: {
              orderBy: [{ isCover: "desc" }, { orderIndex: "asc" }],
              take: 1,
              select: {
                fileUrl: true,
              },
            },
          },
        },
        owner: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const openTickets = await prisma.maintenanceTicket.findMany({
      where: {
        tenantId: access.tenantId,
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 8,
      select: {
        id: true,
        ticketId: true,
        title: true,
        status: true,
        urgencyLevel: true,
        severityJustification: true,
        createdAt: true,
        updatedAt: true,
        propertyCodeSnapshot: true,
        propertyTitleSnapshot: true,
      },
    });

    return {
      tenant: {
        id: access.tenant.id,
        fullName: access.tenant.fullName,
        document: access.tenant.document,
        email: access.tenant.email,
      },
      contracts: activeContracts.map((contract) => ({
        id: contract.id,
        code: contract.code,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rentAmount: Number(contract.rentAmount),
        owner: contract.owner,
        property: {
          id: contract.property.id,
          code: contract.property.code,
          title: contract.property.title,
          addressSummary: `${contract.property.street}, ${contract.property.streetNumber} - ${contract.property.district}, ${contract.property.city}`,
          coverImageUrl: contract.property.propertyImages[0]?.fileUrl ?? null,
        },
      })),
      recentTickets: openTickets,
    };
  }

  async openMaintenanceTicket(
    payload: OpenPortalTicketInput,
    context: RequestContext,
  ) {
    const access = await this.resolveActiveAccess(context.actorUserId);

    const activeContract = await prisma.contract.findFirst({
      where: {
        tenantId: access.tenantId,
        propertyId: payload.propertyId,
        status: {
          in: [ContractStatus.ACTIVE, ContractStatus.RENEWED],
        },
      },
      select: {
        id: true,
        property: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    });

    if (!activeContract) {
      throw new HttpError(
        403,
        "O imóvel informado não está vinculado a um contrato ativo do locatário.",
      );
    }

    if (requiresVisualEvidence(payload.type) && payload.attachments.length === 0) {
      throw new HttpError(
        422,
        "Este tipo de chamado exige ao menos uma foto de evidência.",
      );
    }

    return maintenanceService.createFromPortal(
      {
        propertyId: payload.propertyId,
        tenantId: access.tenantId,
        title: `${resolveTicketTypeLabel(payload.type)} · ${activeContract.property.code}`,
        description: payload.description,
        type: payload.type,
        internalNotes: payload.complementaryNotes,
        attachments: payload.attachments,
      },
      context,
    );
  }

  private async resolveActiveAccess(actorUserId?: string) {
    if (!actorUserId) {
      throw new HttpError(401, "Sessão inválida para o portal do locatário.");
    }

    const access = await prisma.tenantPortalAccess.findFirst({
      where: {
        userId: actorUserId,
        status: TenantPortalAccessStatus.ACTIVE,
      },
      include: {
        tenant: {
          select: {
            id: true,
            fullName: true,
            document: true,
            email: true,
          },
        },
      },
    });

    if (!access) {
      throw new HttpError(
        403,
        "Este usuário não possui acesso ativo ao portal do locatário.",
      );
    }

    return access;
  }
}
