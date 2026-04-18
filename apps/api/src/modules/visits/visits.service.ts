import {
  AuditEntityType,
  LeadStatus,
  Prisma,
  SaleLeadStage,
  UserStatus,
  VisitOutcome,
  VisitStatus,
  RentLeadStage,
} from "@prisma/client";
import { prisma } from "../../core/prisma";
import { HttpError } from "../../core/http-error";
import { buildPaginationMeta, resolvePagination } from "../../core/pagination";
import { createAuditLog } from "../../core/audit";
import { rethrowPrismaError } from "../../core/prisma-error";

type VisitsListQuery = {
  page?: number;
  pageSize?: number;
  status?: VisitStatus;
  propertyId?: string;
  brokerUserId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

type RequestContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

type VisitPayload = {
  propertyId: string;
  saleLeadId?: string | null;
  rentLeadId?: string | null;
  brokerUserId: string;
  scheduledAt: Date;
  status: VisitStatus;
  completedAt?: Date | null;
  outcome?: VisitOutcome | null;
  notes?: string | null;
  resultSummary?: string | null;
};

function normalizeOptionalString(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function mapVisitBase(visit: {
  id: string;
  scheduledAt: Date;
  completedAt: Date | null;
  status: VisitStatus;
  outcome: VisitOutcome | null;
  createdAt: Date;
  property: {
    id: string;
    code: string;
    title: string;
  };
  broker: {
    id: string;
    fullName: string;
  };
  saleLead: {
    id: string;
    code: string;
    customerName: string;
  } | null;
  rentLead: {
    id: string;
    code: string;
    customerName: string;
  } | null;
}) {
  return {
    id: visit.id,
    scheduledAt: visit.scheduledAt,
    completedAt: visit.completedAt,
    status: visit.status,
    outcome: visit.outcome,
    createdAt: visit.createdAt,
    property: visit.property,
    broker: visit.broker,
    lead: visit.saleLead
      ? {
          id: visit.saleLead.id,
          code: visit.saleLead.code,
          customerName: visit.saleLead.customerName,
          type: "SALE" as const,
        }
      : visit.rentLead
        ? {
            id: visit.rentLead.id,
            code: visit.rentLead.code,
            customerName: visit.rentLead.customerName,
            type: "RENT" as const,
          }
        : null,
  };
}

export class VisitsService {
  async list(query: VisitsListQuery) {
    const { page, pageSize, skip, take } = resolvePagination(query);
    const where: Prisma.VisitWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.brokerUserId ? { brokerUserId: query.brokerUserId } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            scheduledAt: {
              ...(query.dateFrom ? { gte: query.dateFrom } : {}),
              ...(query.dateTo ? { lte: query.dateTo } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        skip,
        take,
        orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
        include: {
          property: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
          broker: {
            select: {
              id: true,
              fullName: true,
            },
          },
          saleLead: {
            select: {
              id: true,
              code: true,
              customerName: true,
            },
          },
          rentLead: {
            select: {
              id: true,
              code: true,
              customerName: true,
            },
          },
        },
      }),
      prisma.visit.count({ where }),
    ]);

    return {
      data: items.map(mapVisitBase),
      meta: buildPaginationMeta(total, page, pageSize),
    };
  }

  async getById(id: string) {
    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            code: true,
            title: true,
            city: true,
            district: true,
          },
        },
        broker: {
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
        saleLead: {
          select: {
            id: true,
            code: true,
            customerName: true,
            pipelineStage: true,
            status: true,
          },
        },
        rentLead: {
          select: {
            id: true,
            code: true,
            customerName: true,
            pipelineStage: true,
            status: true,
          },
        },
      },
    });

    if (!visit) {
      throw new HttpError(404, "Visita nao encontrada.");
    }

    return {
      ...mapVisitBase(visit),
      notes: visit.notes,
      resultSummary: visit.resultSummary,
      createdByUser: visit.createdByUser,
    };
  }

  async create(payload: VisitPayload, context: RequestContext) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessao invalida para criar visita.");
    }

    await this.validateVisitRelations(payload);

    try {
      const visit = await prisma.visit.create({
        data: {
          propertyId: payload.propertyId,
          saleLeadId: payload.saleLeadId ?? null,
          rentLeadId: payload.rentLeadId ?? null,
          brokerUserId: payload.brokerUserId,
          createdByUserId: context.actorUserId,
          scheduledAt: payload.scheduledAt,
          completedAt: this.resolveCompletedAt(payload),
          status: payload.status,
          outcome: payload.outcome ?? null,
          notes: normalizeOptionalString(payload.notes),
          resultSummary: normalizeOptionalString(payload.resultSummary),
        },
        include: {
          property: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
          broker: {
            select: {
              id: true,
              fullName: true,
            },
          },
          saleLead: {
            select: {
              id: true,
              code: true,
              customerName: true,
            },
          },
          rentLead: {
            select: {
              id: true,
              code: true,
              customerName: true,
            },
          },
        },
      });

      await this.syncLinkedLeadForVisit(payload);
      await this.audit("visits.create", visit.id, context, payload);

      return mapVisitBase(visit);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao criar visita.");
    }
  }

  async update(id: string, payload: VisitPayload, context: RequestContext) {
    const existingVisit = await prisma.visit.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!existingVisit) {
      throw new HttpError(404, "Visita nao encontrada.");
    }

    await this.validateVisitRelations(payload);

    try {
      const visit = await prisma.visit.update({
        where: { id },
        data: {
          propertyId: payload.propertyId,
          saleLeadId: payload.saleLeadId ?? null,
          rentLeadId: payload.rentLeadId ?? null,
          brokerUserId: payload.brokerUserId,
          scheduledAt: payload.scheduledAt,
          completedAt: this.resolveCompletedAt(payload),
          status: payload.status,
          outcome: payload.outcome ?? null,
          notes: normalizeOptionalString(payload.notes),
          resultSummary: normalizeOptionalString(payload.resultSummary),
        },
        include: {
          property: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
          broker: {
            select: {
              id: true,
              fullName: true,
            },
          },
          saleLead: {
            select: {
              id: true,
              code: true,
              customerName: true,
            },
          },
          rentLead: {
            select: {
              id: true,
              code: true,
              customerName: true,
            },
          },
        },
      });

      await this.syncLinkedLeadForVisit(payload);
      await this.audit("visits.update", visit.id, context, payload);

      return mapVisitBase(visit);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao atualizar visita.");
    }
  }

  private async validateVisitRelations(payload: VisitPayload) {
    const linkedLeadCount = Number(Boolean(payload.saleLeadId)) + Number(Boolean(payload.rentLeadId));

    if (linkedLeadCount !== 1) {
      throw new HttpError(
        422,
        "Toda visita deve estar vinculada a exatamente um lead comercial.",
      );
    }

    const [property, broker] = await Promise.all([
      prisma.property.findUnique({
        where: { id: payload.propertyId },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { id: payload.brokerUserId },
        select: {
          id: true,
          status: true,
        },
      }),
    ]);

    if (!property) {
      throw new HttpError(404, "Imovel vinculado nao encontrado.");
    }

    if (!broker || broker.status !== UserStatus.ACTIVE) {
      throw new HttpError(422, "Corretor responsavel nao esta disponivel.");
    }

    if (payload.saleLeadId) {
      const saleLead = await prisma.saleLead.findUnique({
        where: { id: payload.saleLeadId },
        select: {
          id: true,
          status: true,
          propertyId: true,
        },
      });

      if (!saleLead || saleLead.status !== LeadStatus.OPEN) {
        throw new HttpError(422, "Lead de venda informado nao esta ativo.");
      }

      if (saleLead.propertyId && saleLead.propertyId !== payload.propertyId) {
        throw new HttpError(
          422,
          "Visita precisa usar o mesmo imovel vinculado ao lead de venda.",
        );
      }
    }

    if (payload.rentLeadId) {
      const rentLead = await prisma.rentLead.findUnique({
        where: { id: payload.rentLeadId },
        select: {
          id: true,
          status: true,
          propertyId: true,
        },
      });

      if (!rentLead || rentLead.status !== LeadStatus.OPEN) {
        throw new HttpError(422, "Lead de locacao informado nao esta ativo.");
      }

      if (rentLead.propertyId && rentLead.propertyId !== payload.propertyId) {
        throw new HttpError(
          422,
          "Visita precisa usar o mesmo imovel vinculado ao lead de locacao.",
        );
      }
    }
  }

  private resolveCompletedAt(payload: VisitPayload) {
    if (payload.status === VisitStatus.COMPLETED || payload.status === VisitStatus.NO_SHOW) {
      return payload.completedAt ?? new Date();
    }

    return null;
  }

  private async syncLinkedLeadForVisit(payload: VisitPayload) {
    const now = new Date();

    if (payload.saleLeadId) {
      await prisma.saleLead.update({
        where: { id: payload.saleLeadId },
        data: {
          propertyId: payload.propertyId,
          pipelineStage: SaleLeadStage.VISIT_SCHEDULED,
          lastContactAt: now,
        },
      });
    }

    if (payload.rentLeadId) {
      await prisma.rentLead.update({
        where: { id: payload.rentLeadId },
        data: {
          propertyId: payload.propertyId,
          pipelineStage: RentLeadStage.VISIT_SCHEDULED,
          lastContactAt: now,
        },
      });
    }
  }

  private async audit(
    action: string,
    entityId: string,
    context: RequestContext,
    metadata: unknown,
  ) {
    await createAuditLog({
      actorUserId: context.actorUserId,
      action,
      entityType: AuditEntityType.VISIT,
      entityId,
      description: "Visita alterada no controle operacional.",
      metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}
