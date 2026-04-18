import {
  AuditEntityType,
  GuaranteeType,
  LeadSource,
  LeadStatus,
  Prisma,
  RentLeadStage,
  UserStatus,
} from "@prisma/client";
import { prisma } from "../../core/prisma";
import { HttpError } from "../../core/http-error";
import { buildPaginationMeta, resolvePagination } from "../../core/pagination";
import { createAuditLog } from "../../core/audit";
import { rethrowPrismaError } from "../../core/prisma-error";

type RentLeadsListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: LeadStatus;
  pipelineStage?: RentLeadStage;
  source?: LeadSource;
  propertyId?: string;
  tenantId?: string;
  responsibleUserId?: string;
};

type RequestContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

type RentLeadPayload = {
  code?: string | null;
  pipelineStage: RentLeadStage;
  status: LeadStatus;
  source?: LeadSource | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerDocument?: string | null;
  desiredRegion?: string | null;
  monthlyBudget?: number | null;
  guaranteePreference?: GuaranteeType | null;
  notes?: string | null;
  lossReason?: string | null;
  lastContactAt?: Date | null;
  nextFollowUpAt?: Date | null;
  propertyId?: string | null;
  tenantId?: string | null;
  responsibleUserId: string;
};

function normalizeOptionalString(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function toNumber(value: Prisma.Decimal | number | null) {
  if (value === null) {
    return null;
  }

  return Number(value);
}

function mapRentLeadBase(lead: {
  id: string;
  code: string;
  pipelineStage: RentLeadStage;
  status: LeadStatus;
  source: LeadSource | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  desiredRegion: string | null;
  monthlyBudget: Prisma.Decimal | null;
  guaranteePreference: GuaranteeType | null;
  nextFollowUpAt: Date | null;
  lastContactAt: Date | null;
  createdAt: Date;
  closedAt: Date | null;
  property: {
    id: string;
    code: string;
    title: string;
    status: string;
  } | null;
  tenant: {
    id: string;
    fullName: string;
  } | null;
  responsibleUser: {
    id: string;
    fullName: string;
  };
  _count: {
    visits: number;
    contracts: number;
  };
}) {
  return {
    id: lead.id,
    code: lead.code,
    pipelineStage: lead.pipelineStage,
    status: lead.status,
    source: lead.source,
    customerName: lead.customerName,
    customerEmail: lead.customerEmail,
    customerPhone: lead.customerPhone,
    desiredRegion: lead.desiredRegion,
    monthlyBudget: toNumber(lead.monthlyBudget),
    guaranteePreference: lead.guaranteePreference,
    nextFollowUpAt: lead.nextFollowUpAt,
    lastContactAt: lead.lastContactAt,
    createdAt: lead.createdAt,
    closedAt: lead.closedAt,
    property: lead.property,
    tenant: lead.tenant,
    responsibleUser: lead.responsibleUser,
    visitCount: lead._count.visits,
    contractCount: lead._count.contracts,
  };
}

export class RentLeadsService {
  async list(query: RentLeadsListQuery) {
    const { page, pageSize, skip, take } = resolvePagination(query);
    const where: Prisma.RentLeadWhereInput = {
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: "insensitive" } },
              { customerName: { contains: query.search, mode: "insensitive" } },
              { customerEmail: { contains: query.search, mode: "insensitive" } },
              { customerPhone: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.pipelineStage ? { pipelineStage: query.pipelineStage } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.tenantId ? { tenantId: query.tenantId } : {}),
      ...(query.responsibleUserId
        ? { responsibleUserId: query.responsibleUserId }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.rentLead.findMany({
        where,
        skip,
        take,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        include: {
          property: {
            select: {
              id: true,
              code: true,
              title: true,
              status: true,
            },
          },
          tenant: {
            select: {
              id: true,
              fullName: true,
            },
          },
          responsibleUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              visits: true,
              contracts: true,
            },
          },
        },
      }),
      prisma.rentLead.count({ where }),
    ]);

    return {
      data: items.map(mapRentLeadBase),
      meta: buildPaginationMeta(total, page, pageSize),
    };
  }

  async getById(id: string) {
    const lead = await prisma.rentLead.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            commercialSituation: true,
            city: true,
            district: true,
            owner: {
              select: {
                fullName: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            fullName: true,
            document: true,
            scoreStatus: true,
          },
        },
        responsibleUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        createdByUser: {
          select: {
            fullName: true,
          },
        },
        visits: {
          orderBy: { scheduledAt: "desc" },
          take: 12,
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            outcome: true,
            resultSummary: true,
            broker: {
              select: {
                fullName: true,
              },
            },
          },
        },
        contracts: {
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            code: true,
            status: true,
            startDate: true,
            endDate: true,
            rentAmount: true,
          },
        },
        _count: {
          select: {
            visits: true,
            contracts: true,
          },
        },
      },
    });

    if (!lead) {
      throw new HttpError(404, "Lead de locacao nao encontrado.");
    }

    return {
      ...mapRentLeadBase(lead),
      customerDocument: lead.customerDocument,
      notes: lead.notes,
      lossReason: lead.lossReason,
      createdByUser: lead.createdByUser,
      visits: lead.visits,
      contracts: lead.contracts.map((contract) => ({
        ...contract,
        rentAmount: Number(contract.rentAmount),
      })),
      metrics: {
        visitCount: lead._count.visits,
        contractCount: lead._count.contracts,
      },
    };
  }

  async create(payload: RentLeadPayload, context: RequestContext) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessao invalida para criar lead.");
    }

    const normalizedState = this.normalizePipelineState(
      payload.pipelineStage,
      payload.status,
    );

    await this.ensureResponsibleUserExists(payload.responsibleUserId);
    await this.validatePropertyRules(payload.propertyId, normalizedState.status);
    await this.validateTenantRules(payload.tenantId, normalizedState.status);

    try {
      const lead = await prisma.rentLead.create({
        data: {
          code: this.buildCode(payload.code),
          pipelineStage: normalizedState.pipelineStage,
          status: normalizedState.status,
          source: payload.source ?? null,
          customerName: payload.customerName.trim(),
          customerEmail: normalizeOptionalString(payload.customerEmail),
          customerPhone: normalizeOptionalString(payload.customerPhone),
          customerDocument: normalizeOptionalString(payload.customerDocument),
          desiredRegion: normalizeOptionalString(payload.desiredRegion),
          monthlyBudget: payload.monthlyBudget ?? null,
          guaranteePreference: payload.guaranteePreference ?? null,
          notes: normalizeOptionalString(payload.notes),
          lossReason: normalizeOptionalString(payload.lossReason),
          lastContactAt: payload.lastContactAt ?? null,
          nextFollowUpAt: payload.nextFollowUpAt ?? null,
          propertyId: payload.propertyId ?? null,
          tenantId: payload.tenantId ?? null,
          responsibleUserId: payload.responsibleUserId,
          createdByUserId: context.actorUserId,
          closedAt:
            normalizedState.status === LeadStatus.OPEN ? null : new Date(),
        },
        include: {
          property: {
            select: {
              id: true,
              code: true,
              title: true,
              status: true,
            },
          },
          tenant: {
            select: {
              id: true,
              fullName: true,
            },
          },
          responsibleUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              visits: true,
              contracts: true,
            },
          },
        },
      });

      if (lead.status === LeadStatus.WON && lead.property?.id) {
        await this.finalizeRentedProperty(lead.property.id, lead.id);
      }

      await this.audit("rent-leads.create", lead.id, lead.code, context, payload);

      return mapRentLeadBase(lead);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao criar lead de locacao.");
    }
  }

  async update(id: string, payload: RentLeadPayload, context: RequestContext) {
    const existingLead = await prisma.rentLead.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        closedAt: true,
      },
    });

    if (!existingLead) {
      throw new HttpError(404, "Lead de locacao nao encontrado.");
    }

    const normalizedState = this.normalizePipelineState(
      payload.pipelineStage,
      payload.status,
    );

    await this.ensureResponsibleUserExists(payload.responsibleUserId);
    await this.validatePropertyRules(payload.propertyId, normalizedState.status);
    await this.validateTenantRules(payload.tenantId, normalizedState.status);

    try {
      const lead = await prisma.rentLead.update({
        where: { id },
        data: {
          code: this.buildCode(payload.code),
          pipelineStage: normalizedState.pipelineStage,
          status: normalizedState.status,
          source: payload.source ?? null,
          customerName: payload.customerName.trim(),
          customerEmail: normalizeOptionalString(payload.customerEmail),
          customerPhone: normalizeOptionalString(payload.customerPhone),
          customerDocument: normalizeOptionalString(payload.customerDocument),
          desiredRegion: normalizeOptionalString(payload.desiredRegion),
          monthlyBudget: payload.monthlyBudget ?? null,
          guaranteePreference: payload.guaranteePreference ?? null,
          notes: normalizeOptionalString(payload.notes),
          lossReason: normalizeOptionalString(payload.lossReason),
          lastContactAt: payload.lastContactAt ?? null,
          nextFollowUpAt: payload.nextFollowUpAt ?? null,
          propertyId: payload.propertyId ?? null,
          tenantId: payload.tenantId ?? null,
          responsibleUserId: payload.responsibleUserId,
          closedAt:
            normalizedState.status === LeadStatus.OPEN
              ? null
              : existingLead.closedAt ?? new Date(),
        },
        include: {
          property: {
            select: {
              id: true,
              code: true,
              title: true,
              status: true,
            },
          },
          tenant: {
            select: {
              id: true,
              fullName: true,
            },
          },
          responsibleUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              visits: true,
              contracts: true,
            },
          },
        },
      });

      if (lead.status === LeadStatus.WON && lead.property?.id) {
        await this.finalizeRentedProperty(lead.property.id, lead.id);
      }

      await this.audit("rent-leads.update", lead.id, lead.code, context, payload);

      return mapRentLeadBase(lead);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao atualizar lead de locacao.");
    }
  }

  private normalizePipelineState(
    pipelineStage: RentLeadStage,
    status: LeadStatus,
  ) {
    if (pipelineStage === RentLeadStage.ACTIVE) {
      return {
        pipelineStage,
        status: LeadStatus.WON,
      };
    }

    if (pipelineStage === RentLeadStage.LOST) {
      return {
        pipelineStage,
        status: LeadStatus.LOST,
      };
    }

    if (status === LeadStatus.WON) {
      return {
        pipelineStage: RentLeadStage.ACTIVE,
        status,
      };
    }

    if (status === LeadStatus.LOST) {
      return {
        pipelineStage: RentLeadStage.LOST,
        status,
      };
    }

    return {
      pipelineStage,
      status,
    };
  }

  private async ensureResponsibleUserExists(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new HttpError(422, "Responsavel informado nao esta disponivel.");
    }
  }

  private async validatePropertyRules(
    propertyId: string | null | undefined,
    status: LeadStatus,
  ) {
    if (!propertyId) {
      if (status === LeadStatus.WON) {
        throw new HttpError(
          422,
          "Lead ganho precisa estar vinculado a um imovel.",
        );
      }

      return;
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!property) {
      throw new HttpError(404, "Imovel vinculado nao encontrado.");
    }

    if (property.status === "SOLD" && status === LeadStatus.OPEN) {
      throw new HttpError(
        422,
        "Imovel vendido nao pode permanecer no pipeline comercial.",
      );
    }

    if (property.status === "RENTED" && status === LeadStatus.OPEN) {
      throw new HttpError(
        422,
        "Imovel alugado nao pode permanecer disponivel no pipeline de locacao.",
      );
    }
  }

  private async validateTenantRules(
    tenantId: string | null | undefined,
    status: LeadStatus,
  ) {
    if (!tenantId) {
      if (status === LeadStatus.WON) {
        throw new HttpError(
          422,
          "Lead ativo precisa estar vinculado a um locatario cadastrado.",
        );
      }

      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!tenant || !tenant.isActive) {
      throw new HttpError(422, "Locatario vinculado nao esta disponivel.");
    }
  }

  private async finalizeRentedProperty(propertyId: string, winningLeadId: string) {
    const now = new Date();

    await prisma.$transaction([
      prisma.property.update({
        where: { id: propertyId },
        data: {
          status: "RENTED",
          commercialSituation: "RENTED",
        },
      }),
      prisma.rentLead.updateMany({
        where: {
          propertyId,
          id: { not: winningLeadId },
          status: LeadStatus.OPEN,
        },
        data: {
          status: LeadStatus.ARCHIVED,
          closedAt: now,
          lossReason:
            "Arquivado automaticamente porque o imovel foi alugado.",
        },
      }),
    ]);
  }

  private buildCode(code?: string | null) {
    if (code && code.trim().length > 0) {
      return code.trim().toUpperCase();
    }

    return `LOC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  private async audit(
    action: string,
    entityId: string,
    code: string,
    context: RequestContext,
    metadata: unknown,
  ) {
    await createAuditLog({
      actorUserId: context.actorUserId,
      action,
      entityType: AuditEntityType.RENT_LEAD,
      entityId,
      description: `Lead de locacao ${code} sofreu alteracao no pipeline.`,
      metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}
