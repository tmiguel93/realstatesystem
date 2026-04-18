import { AuditEntityType, LeadSource, LeadStatus, Prisma, SaleLeadStage, UserStatus } from "@prisma/client";
import { prisma } from "../../core/prisma";
import { HttpError } from "../../core/http-error";
import { buildPaginationMeta, resolvePagination } from "../../core/pagination";
import { createAuditLog } from "../../core/audit";
import { rethrowPrismaError } from "../../core/prisma-error";

type SaleLeadsListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: LeadStatus;
  pipelineStage?: SaleLeadStage;
  source?: LeadSource;
  propertyId?: string;
  responsibleUserId?: string;
};

type RequestContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

type SaleLeadPayload = {
  code?: string | null;
  pipelineStage: SaleLeadStage;
  status: LeadStatus;
  source?: LeadSource | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerDocument?: string | null;
  desiredRegion?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  notes?: string | null;
  lossReason?: string | null;
  lastContactAt?: Date | null;
  nextFollowUpAt?: Date | null;
  propertyId?: string | null;
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

function mapSaleLeadBase(lead: {
  id: string;
  code: string;
  pipelineStage: SaleLeadStage;
  status: LeadStatus;
  source: LeadSource | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  desiredRegion: string | null;
  budgetMin: Prisma.Decimal | null;
  budgetMax: Prisma.Decimal | null;
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
  responsibleUser: {
    id: string;
    fullName: string;
  };
  _count: {
    visits: number;
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
    budgetMin: toNumber(lead.budgetMin),
    budgetMax: toNumber(lead.budgetMax),
    nextFollowUpAt: lead.nextFollowUpAt,
    lastContactAt: lead.lastContactAt,
    createdAt: lead.createdAt,
    closedAt: lead.closedAt,
    property: lead.property,
    responsibleUser: lead.responsibleUser,
    visitCount: lead._count.visits,
  };
}

export class SaleLeadsService {
  async list(query: SaleLeadsListQuery) {
    const { page, pageSize, skip, take } = resolvePagination(query);
    const where: Prisma.SaleLeadWhereInput = {
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
      ...(query.responsibleUserId
        ? { responsibleUserId: query.responsibleUserId }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.saleLead.findMany({
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
          responsibleUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              visits: true,
            },
          },
        },
      }),
      prisma.saleLead.count({ where }),
    ]);

    return {
      data: items.map(mapSaleLeadBase),
      meta: buildPaginationMeta(total, page, pageSize),
    };
  }

  async getById(id: string) {
    const lead = await prisma.saleLead.findUnique({
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
        _count: {
          select: {
            visits: true,
          },
        },
      },
    });

    if (!lead) {
      throw new HttpError(404, "Lead de venda nao encontrado.");
    }

    return {
      ...mapSaleLeadBase(lead),
      customerDocument: lead.customerDocument,
      notes: lead.notes,
      lossReason: lead.lossReason,
      createdByUser: lead.createdByUser,
      visits: lead.visits,
      metrics: {
        visitCount: lead._count.visits,
      },
    };
  }

  async create(payload: SaleLeadPayload, context: RequestContext) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessao invalida para criar lead.");
    }

    const normalizedState = this.normalizePipelineState(
      payload.pipelineStage,
      payload.status,
    );

    await this.ensureResponsibleUserExists(payload.responsibleUserId);
    await this.validatePropertyRules(payload.propertyId, normalizedState.status);

    try {
      const lead = await prisma.saleLead.create({
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
          budgetMin: payload.budgetMin ?? null,
          budgetMax: payload.budgetMax ?? null,
          notes: normalizeOptionalString(payload.notes),
          lossReason: normalizeOptionalString(payload.lossReason),
          lastContactAt: payload.lastContactAt ?? null,
          nextFollowUpAt: payload.nextFollowUpAt ?? null,
          propertyId: payload.propertyId ?? null,
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
          responsibleUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              visits: true,
            },
          },
        },
      });

      if (lead.status === LeadStatus.WON && lead.property?.id) {
        await this.finalizeSoldProperty(lead.property.id, lead.id);
      }

      await this.audit("sale-leads.create", lead.id, lead.code, context, payload);

      return mapSaleLeadBase(lead);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao criar lead de venda.");
    }
  }

  async update(id: string, payload: SaleLeadPayload, context: RequestContext) {
    const existingLead = await prisma.saleLead.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        closedAt: true,
      },
    });

    if (!existingLead) {
      throw new HttpError(404, "Lead de venda nao encontrado.");
    }

    const normalizedState = this.normalizePipelineState(
      payload.pipelineStage,
      payload.status,
    );

    await this.ensureResponsibleUserExists(payload.responsibleUserId);
    await this.validatePropertyRules(payload.propertyId, normalizedState.status);

    try {
      const lead = await prisma.saleLead.update({
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
          budgetMin: payload.budgetMin ?? null,
          budgetMax: payload.budgetMax ?? null,
          notes: normalizeOptionalString(payload.notes),
          lossReason: normalizeOptionalString(payload.lossReason),
          lastContactAt: payload.lastContactAt ?? null,
          nextFollowUpAt: payload.nextFollowUpAt ?? null,
          propertyId: payload.propertyId ?? null,
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
          responsibleUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              visits: true,
            },
          },
        },
      });

      if (lead.status === LeadStatus.WON && lead.property?.id) {
        await this.finalizeSoldProperty(lead.property.id, lead.id);
      }

      await this.audit("sale-leads.update", lead.id, lead.code, context, payload);

      return mapSaleLeadBase(lead);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao atualizar lead de venda.");
    }
  }

  private normalizePipelineState(
    pipelineStage: SaleLeadStage,
    status: LeadStatus,
  ) {
    if (pipelineStage === SaleLeadStage.CLOSED) {
      return {
        pipelineStage,
        status: LeadStatus.WON,
      };
    }

    if (pipelineStage === SaleLeadStage.LOST) {
      return {
        pipelineStage,
        status: LeadStatus.LOST,
      };
    }

    if (status === LeadStatus.WON) {
      return {
        pipelineStage: SaleLeadStage.CLOSED,
        status,
      };
    }

    if (status === LeadStatus.LOST) {
      return {
        pipelineStage: SaleLeadStage.LOST,
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
        "Imovel vendido nao pode permanecer no pipeline comercial de vendas.",
      );
    }
  }

  private async finalizeSoldProperty(propertyId: string, winningLeadId: string) {
    const now = new Date();

    await prisma.$transaction([
      prisma.property.update({
        where: { id: propertyId },
        data: {
          status: "SOLD",
          commercialSituation: "SOLD",
        },
      }),
      prisma.saleLead.updateMany({
        where: {
          propertyId,
          id: { not: winningLeadId },
          status: LeadStatus.OPEN,
        },
        data: {
          status: LeadStatus.ARCHIVED,
          closedAt: now,
          lossReason:
            "Arquivado automaticamente porque o imovel foi vendido.",
        },
      }),
      prisma.rentLead.updateMany({
        where: {
          propertyId,
          status: LeadStatus.OPEN,
        },
        data: {
          status: LeadStatus.ARCHIVED,
          closedAt: now,
          lossReason:
            "Arquivado automaticamente porque o imovel foi vendido.",
        },
      }),
    ]);
  }

  private buildCode(code?: string | null) {
    if (code && code.trim().length > 0) {
      return code.trim().toUpperCase();
    }

    return `VND-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
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
      entityType: AuditEntityType.SALE_LEAD,
      entityId,
      description: `Lead de venda ${code} sofreu alteracao no pipeline.`,
      metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}
