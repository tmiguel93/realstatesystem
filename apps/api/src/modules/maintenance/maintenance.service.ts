import {
  AuditEntityType,
  ContractStatus,
  DocumentCategory,
  MaintenanceSeveritySourceType,
  MaintenanceTriageDecision,
  MaintenanceTicketHistoryActionType,
  MaintenanceTicketStatus,
  MaintenanceTicketType,
  Prisma,
  UserStatus,
} from "@prisma/client";
import { permissionCodes, roleCodes } from "@imobiliaria/shared";
import { createAuditLog } from "../../core/audit";
import { HttpError } from "../../core/http-error";
import {
  buildPaginationMeta,
  resolvePagination,
} from "../../core/pagination";
import { prisma } from "../../core/prisma";
import { rethrowPrismaError } from "../../core/prisma-error";
import {
  getDaysSinceLastUpdate,
  getMaintenanceStatusLabel,
  getMaintenanceTriageDecisionLabel,
  getMaintenanceTypeLabel,
  getMaintenanceUrgencyLabel,
  getOpenDays,
  isMaintenanceTerminalStatus,
  resolveSlaDueDate,
} from "./maintenance.rules";
import {
  maintenanceSeverityEvaluator,
  type MaintenanceSeverityResult,
} from "./maintenance-severity-evaluator";

type Tx = Prisma.TransactionClient;

type RequestContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
  permissions?: string[];
  roles?: string[];
};

type MaintenanceListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  propertyId?: string;
  status?: MaintenanceTicketStatus;
  type?: MaintenanceTicketType;
  triageDecision?: MaintenanceTriageDecision;
  urgencyLevel?: number;
  assignedToUserId?: string;
  openedByUserId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  onlyCritical?: boolean;
};

type AttachmentInput = {
  name: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
};

type MaintenanceCreatePayload = {
  propertyId: string;
  tenantId?: string | null;
  title: string;
  description: string;
  type: MaintenanceTicketType;
  urgencyLevel?: number | null;
  triageDecision?: MaintenanceTriageDecision | null;
  triageNotes?: string | null;
  assignedToUserId?: string | null;
  internalNotes?: string | null;
  attachments: AttachmentInput[];
  openedViaTenantPortal?: boolean;
};

type MaintenanceUpdatePayload = Partial<MaintenanceCreatePayload>;

type MaintenanceStatusPayload = {
  status: MaintenanceTicketStatus;
  resolutionSummary?: string | null;
  cancelReason?: string | null;
  internalNotes?: string | null;
  assignedToUserId?: string | null;
};

type MaintenanceTriagePayload = {
  triageDecision: MaintenanceTriageDecision;
  triageNotes?: string | null;
  assignedToUserId?: string | null;
};

function normalizeOptionalString(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function buildAddressSummary(property: {
  street: string;
  streetNumber: string;
  district: string;
  city: string;
  state: string;
}) {
  return `${property.street}, ${property.streetNumber} - ${property.district}, ${property.city}/${property.state}`;
}

function getStartOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function getEndOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

function toJsonObject(
  value: Record<string, unknown>,
): Prisma.InputJsonObject {
  return value as Prisma.InputJsonObject;
}

function resolveStatusBucket(status: MaintenanceTicketStatus) {
  if (status === MaintenanceTicketStatus.CANCELLED) {
    return "cancelled" as const;
  }

  if (status === MaintenanceTicketStatus.FINISHED) {
    return "finished" as const;
  }

  if (
    status === MaintenanceTicketStatus.WAITING_APPROVAL ||
    status === MaintenanceTicketStatus.WAITING_PROVIDER ||
    status === MaintenanceTicketStatus.IN_PROGRESS ||
    status === MaintenanceTicketStatus.WAITING_MATERIAL ||
    status === MaintenanceTicketStatus.RESOLVED
  ) {
    return "inProgress" as const;
  }

  return "open" as const;
}

function resolveDefaultTriageDecision(
  type: MaintenanceTicketType,
  urgencyLevel: number,
) {
  if (
    urgencyLevel >= 5 ||
    type === MaintenanceTicketType.EMERGENCY ||
    type === MaintenanceTicketType.GAS ||
    type === MaintenanceTicketType.ELECTRICAL
  ) {
    return MaintenanceTriageDecision.EMERGENCY;
  }

  const quoteRequiredTypes = new Set<MaintenanceTicketType>([
    MaintenanceTicketType.HYDRAULIC,
    MaintenanceTicketType.STRUCTURAL,
    MaintenanceTicketType.ROOFING,
    MaintenanceTicketType.LEAKAGE,
    MaintenanceTicketType.SEWAGE,
    MaintenanceTicketType.LOCKS_SECURITY,
    MaintenanceTicketType.HVAC,
    MaintenanceTicketType.EQUIPMENT,
    MaintenanceTicketType.CONDOMINIUM,
  ]);

  if (quoteRequiredTypes.has(type)) {
    return MaintenanceTriageDecision.NEEDS_QUOTE;
  }

  return MaintenanceTriageDecision.INTERNAL_REPAIR;
}

function resolveStatusForTriageDecision(
  decision: MaintenanceTriageDecision,
) {
  if (decision === MaintenanceTriageDecision.NEEDS_QUOTE) {
    return MaintenanceTicketStatus.WAITING_PROVIDER;
  }

  if (decision === MaintenanceTriageDecision.INTERNAL_REPAIR) {
    return MaintenanceTicketStatus.IN_PROGRESS;
  }

  return MaintenanceTicketStatus.TRIAGE;
}

function applyTriageDecisionToSeverity(
  severity: MaintenanceSeverityResult & { automaticScore: number },
  decision: MaintenanceTriageDecision,
) {
  if (
    decision === MaintenanceTriageDecision.EMERGENCY &&
    severity.score < 5
  ) {
    return {
      ...severity,
      score: 5,
      justification: `${severity.justification} Triagem emergencial elevou a urgência para nível 5.`,
    };
  }

  if (
    decision === MaintenanceTriageDecision.NEEDS_QUOTE &&
    severity.score < 3
  ) {
    return {
      ...severity,
      score: 3,
      justification: `${severity.justification} Triagem indicou necessidade de orçamento e manteve prioridade mínima alta.`,
    };
  }

  return severity;
}

function mapTicketBase(ticket: {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  type: MaintenanceTicketType;
  urgencyLevel: number;
  severitySourceType: MaintenanceSeveritySourceType;
  severityJustification: string | null;
  triageDecision: MaintenanceTriageDecision | null;
  triageNotes: string | null;
  triagedAt: Date | null;
  status: MaintenanceTicketStatus;
  propertyId: string;
  tenantId: string | null;
  propertyCodeSnapshot: string;
  propertyTitleSnapshot: string;
  addressSnapshot: string;
  ownerNameSnapshot: string;
  tenantNameSnapshot: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  finishedAt: Date | null;
  assignedToUser: { id: string; fullName: string } | null;
  openedByUser: { id: string; fullName: string };
  _count: {
    history: number;
    documents: number;
  };
}) {
  const slaDueAt = resolveSlaDueDate(ticket.createdAt, ticket.urgencyLevel);
  const now = new Date();
  const isOverdue =
    !isMaintenanceTerminalStatus(ticket.status) && slaDueAt < now;

  return {
    id: ticket.id,
    ticketId: ticket.ticketId,
    title: ticket.title,
    description: ticket.description,
    type: ticket.type,
    urgencyLevel: ticket.urgencyLevel,
    urgencyLabel: getMaintenanceUrgencyLabel(ticket.urgencyLevel),
    severitySourceType: ticket.severitySourceType,
    severityJustification: ticket.severityJustification,
    triageDecision: ticket.triageDecision,
    triageLabel: getMaintenanceTriageDecisionLabel(ticket.triageDecision),
    triageNotes: ticket.triageNotes,
    triagedAt: ticket.triagedAt,
    status: ticket.status,
    statusLabel: getMaintenanceStatusLabel(ticket.status),
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    resolvedAt: ticket.resolvedAt,
    finishedAt: ticket.finishedAt,
    openDays: getOpenDays(ticket.createdAt, now),
    daysWithoutUpdate: getDaysSinceLastUpdate(ticket.updatedAt, now),
    slaDueAt,
    isOverdue,
    property: {
      id: ticket.propertyId,
      code: ticket.propertyCodeSnapshot,
      title: ticket.propertyTitleSnapshot,
      addressSummary: ticket.addressSnapshot,
      ownerName: ticket.ownerNameSnapshot,
    },
    tenant: ticket.tenantId
      ? {
          id: ticket.tenantId,
          fullName: ticket.tenantNameSnapshot ?? "Locatario nao identificado",
        }
      : null,
    openedByUser: ticket.openedByUser,
    assignedToUser: ticket.assignedToUser,
    historyCount: ticket._count.history,
    attachmentCount: ticket._count.documents,
  };
}

type ResolvedPropertyContext = {
  property: {
    id: string;
    code: string;
    title: string;
    street: string;
    streetNumber: string;
    district: string;
    city: string;
    state: string;
  };
  owner: {
    id: string;
    fullName: string;
  };
  activeTenant: {
    id: string;
    fullName: string;
  } | null;
  addressSummary: string;
};

export class MaintenanceService {
  async list(query: MaintenanceListQuery, context: RequestContext) {
    const { page, pageSize, skip, take } = resolvePagination(query);
    const where = this.buildScopedWhere(query, context);

    if (query.onlyCritical) {
      const items = await prisma.maintenanceTicket.findMany({
        where,
        orderBy: [{ urgencyLevel: "desc" }, { createdAt: "asc" }],
        include: {
          openedByUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
          assignedToUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              history: true,
              documents: true,
            },
          },
        },
      });

      const criticalItems = items.filter((item) => this.isCriticalTicket(item));
      const pagedItems = criticalItems.slice(skip, skip + take);

      return {
        data: pagedItems.map(mapTicketBase),
        meta: buildPaginationMeta(criticalItems.length, page, pageSize),
      };
    }

    const [items, total] = await Promise.all([
      prisma.maintenanceTicket.findMany({
        where,
        skip,
        take,
        orderBy: [{ urgencyLevel: "desc" }, { createdAt: "asc" }],
        include: {
          openedByUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
          assignedToUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              history: true,
              documents: true,
            },
          },
        },
      }),
      prisma.maintenanceTicket.count({ where }),
    ]);

    return {
      data: items.map(mapTicketBase),
      meta: buildPaginationMeta(total, page, pageSize),
    };
  }

  async getById(id: string, context: RequestContext) {
    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            code: true,
            title: true,
            street: true,
            streetNumber: true,
            district: true,
            city: true,
            state: true,
            owner: {
              select: {
                id: true,
                fullName: true,
                document: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            fullName: true,
            document: true,
            phone: true,
            email: true,
          },
        },
        openedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        assignedToUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        triagedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        history: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        severityAssessments: {
          orderBy: { evaluatedAt: "desc" },
          include: {
            evaluatedByUser: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        documents: {
          where: {
            category: DocumentCategory.MAINTENANCE_ATTACHMENT,
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            fileUrl: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            history: true,
            documents: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new HttpError(404, "Chamado de manutencao nao encontrado.");
    }

    this.ensureTicketAccess(ticket, context);

    return {
      ...mapTicketBase(ticket),
      description: ticket.description,
      internalNotes: ticket.internalNotes,
      resolutionSummary: ticket.resolutionSummary,
      cancelReason: ticket.cancelReason,
      lastStatusChangeAt: ticket.lastStatusChangeAt,
      severitySourceType: ticket.severitySourceType,
      severityJustification: ticket.severityJustification,
      triageDecision: ticket.triageDecision,
      triageLabel: getMaintenanceTriageDecisionLabel(ticket.triageDecision),
      triageNotes: ticket.triageNotes,
      triagedAt: ticket.triagedAt,
      triagedByUser: ticket.triagedByUser,
      property: {
        ...mapTicketBase(ticket).property,
        street: ticket.property.street,
        streetNumber: ticket.property.streetNumber,
        district: ticket.property.district,
        city: ticket.property.city,
        state: ticket.property.state,
        owner: ticket.property.owner,
      },
      tenant: ticket.tenant,
      openedByUser: ticket.openedByUser,
      assignedToUser: ticket.assignedToUser,
      attachments: ticket.documents,
      history: ticket.history.map((item) => ({
        id: item.id,
        actionType: item.actionType,
        description: item.description,
        oldValue: item.oldValue,
        newValue: item.newValue,
        createdAt: item.createdAt,
        user: item.user,
      })),
      severityAssessments: ticket.severityAssessments.map((item) => ({
        id: item.id,
        sourceType: item.sourceType,
        score: item.score,
        justification: item.justification,
        evaluatedAt: item.evaluatedAt,
        evaluatedByUser: item.evaluatedByUser,
      })),
      metrics: {
        historyCount: ticket._count.history,
        attachmentCount: ticket._count.documents,
      },
    };
  }

  async getHistory(id: string, context: RequestContext) {
    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id },
      select: {
        id: true,
        openedByUserId: true,
        assignedToUserId: true,
      },
    });

    if (!ticket) {
      throw new HttpError(404, "Chamado de manutencao nao encontrado.");
    }

    this.ensureTicketAccess(ticket, context);

    const history = await prisma.maintenanceTicketHistory.findMany({
      where: { maintenanceTicketId: id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return history.map((item) => ({
      id: item.id,
      actionType: item.actionType,
      description: item.description,
      oldValue: item.oldValue,
      newValue: item.newValue,
      createdAt: item.createdAt,
      user: item.user,
    }));
  }

  async getPropertyContext(
    input: { propertyId?: string; propertyCode?: string },
    context: RequestContext,
  ) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessao invalida.");
    }

    const propertyContext = await this.resolvePropertyContext(
      prisma,
      input,
    );

    return {
      property: {
        id: propertyContext.property.id,
        code: propertyContext.property.code,
        title: propertyContext.property.title,
        addressSummary: propertyContext.addressSummary,
      },
      owner: propertyContext.owner,
      activeTenant: propertyContext.activeTenant,
    };
  }

  async create(payload: MaintenanceCreatePayload, context: RequestContext) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessao invalida para abrir chamado.");
    }

    const canOverride = this.canOverride(context);

    try {
      const ticket = await prisma.$transaction(async (tx) => {
        const propertyContext = await this.resolvePropertyContext(tx, {
          propertyId: payload.propertyId,
        });
        const assignedToUserId = await this.resolveAssignedUserId(
          tx,
          payload.assignedToUserId,
        );
        const tenantId = await this.resolveTenantId(
          tx,
          payload.tenantId,
          propertyContext.activeTenant?.id ?? null,
          canOverride,
        );
        const evaluatedSeverity = await this.evaluateSeverity({
          type: payload.type,
          description: payload.description,
          attachments: payload.attachments,
          requestedUrgencyLevel: payload.urgencyLevel,
          canOverride,
        });
        const triageDecision =
          payload.triageDecision ??
          resolveDefaultTriageDecision(payload.type, evaluatedSeverity.score);
        const severity = applyTriageDecisionToSeverity(
          evaluatedSeverity,
          triageDecision,
        );
        const ticketId = await this.generateTicketId(tx);
        const now = new Date();

        const createdTicket = await tx.maintenanceTicket.create({
          data: {
            ticketId,
            propertyId: propertyContext.property.id,
            tenantId,
            openedByUserId: context.actorUserId!,
            assignedToUserId,
            title: payload.title.trim(),
            description: payload.description.trim(),
            type: payload.type,
            urgencyLevel: severity.score,
            severitySourceType: severity.sourceType,
            severityJustification: severity.justification,
            triageDecision,
            triageNotes: normalizeOptionalString(payload.triageNotes),
            triagedAt: now,
            triagedByUserId: context.actorUserId,
            status: MaintenanceTicketStatus.TRIAGE,
            lastStatusChangeAt: now,
            propertyCodeSnapshot: propertyContext.property.code,
            propertyTitleSnapshot: propertyContext.property.title,
            addressSnapshot: propertyContext.addressSummary,
            ownerNameSnapshot: propertyContext.owner.fullName,
            tenantNameSnapshot:
              tenantId === propertyContext.activeTenant?.id
                ? propertyContext.activeTenant?.fullName ?? null
                : await this.getTenantNameById(tx, tenantId),
            internalNotes: normalizeOptionalString(payload.internalNotes),
            openedViaTenantPortal: payload.openedViaTenantPortal ?? false,
          },
          include: {
            openedByUser: {
              select: {
                id: true,
                fullName: true,
              },
            },
            assignedToUser: {
              select: {
                id: true,
                fullName: true,
              },
            },
            _count: {
              select: {
                history: true,
                documents: true,
              },
            },
          },
        });

        await tx.maintenanceTicketHistory.create({
          data: {
            maintenanceTicketId: createdTicket.id,
            userId: context.actorUserId,
            actionType: MaintenanceTicketHistoryActionType.OPENED,
            description: `Chamado ${createdTicket.ticketId} aberto em ${getMaintenanceStatusLabel(createdTicket.status)}.`,
            newValue: {
              title: createdTicket.title,
              type: createdTicket.type,
              urgencyLevel: createdTicket.urgencyLevel,
              triageDecision: createdTicket.triageDecision,
              severityJustification: createdTicket.severityJustification,
            },
          },
        });

        await tx.maintenanceTicketHistory.create({
          data: {
            maintenanceTicketId: createdTicket.id,
            userId: context.actorUserId,
            actionType: MaintenanceTicketHistoryActionType.TRIAGED,
            description: `Triagem inicial classificada como ${getMaintenanceTriageDecisionLabel(triageDecision)}.`,
            newValue: {
              triageDecision,
              triageNotes: createdTicket.triageNotes,
              status: createdTicket.status,
              urgencyLevel: createdTicket.urgencyLevel,
            },
          },
        });

        await this.registerSeverityAssessment(
          tx,
          createdTicket.id,
          severity,
          context.actorUserId,
        );

        await this.syncAttachments(
          tx,
          createdTicket.id,
          payload.attachments,
          context.actorUserId,
        );

        if (
          payload.urgencyLevel &&
          payload.urgencyLevel !== severity.automaticScore
        ) {
          await this.auditUrgencyOverride(
            createdTicket.id,
            createdTicket.ticketId,
            context,
            {
              requestedUrgencyLevel: payload.urgencyLevel,
              automaticUrgencyLevel: severity.automaticScore,
              justification: severity.justification,
            },
          );
        }

        await this.audit(
          "maintenance.create",
          createdTicket.id,
          createdTicket.ticketId,
          context,
          {
            type: createdTicket.type,
            urgencyLevel: createdTicket.urgencyLevel,
            severitySourceType: createdTicket.severitySourceType,
            triageDecision: createdTicket.triageDecision,
          },
        );

        return createdTicket;
      });

      return mapTicketBase(ticket);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao abrir chamado de manutencao.");
    }
  }

  async update(
    id: string,
    payload: MaintenanceUpdatePayload,
    context: RequestContext,
  ) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessao invalida.");
    }

    const canOverride = this.canOverride(context);

    try {
      const ticket = await prisma.$transaction(async (tx) => {
        const existing = await tx.maintenanceTicket.findUnique({
          where: { id },
          select: {
            id: true,
            ticketId: true,
            propertyId: true,
            tenantId: true,
            openedByUserId: true,
            assignedToUserId: true,
            title: true,
            description: true,
            type: true,
            urgencyLevel: true,
            severitySourceType: true,
            severityJustification: true,
            triageDecision: true,
            triageNotes: true,
            triagedAt: true,
            triagedByUserId: true,
            status: true,
            internalNotes: true,
            propertyCodeSnapshot: true,
            propertyTitleSnapshot: true,
            addressSnapshot: true,
            ownerNameSnapshot: true,
            tenantNameSnapshot: true,
          },
        });

        if (!existing) {
          throw new HttpError(404, "Chamado de manutencao nao encontrado.");
        }

        this.ensureTicketAccess(existing, context);

        const propertyContext =
          payload.propertyId && payload.propertyId !== existing.propertyId
            ? await this.resolvePropertyContext(tx, {
                propertyId: payload.propertyId,
              })
            : null;

        const resolvedTenantId = await this.resolveTenantId(
          tx,
          payload.tenantId,
          propertyContext?.activeTenant?.id ?? existing.tenantId,
          canOverride,
        );
        const resolvedAssignedToUserId = await this.resolveAssignedUserId(
          tx,
          payload.assignedToUserId,
        );
        const resolvedType = payload.type ?? existing.type;
        const evaluatedSeverity = await this.evaluateSeverity({
          type: resolvedType,
          description: payload.description ?? existing.description,
          attachments: payload.attachments ?? [],
          requestedUrgencyLevel:
            payload.urgencyLevel === undefined
              ? existing.urgencyLevel
              : payload.urgencyLevel,
          canOverride,
          preserveWhenUnchanged:
            payload.type === undefined &&
            payload.urgencyLevel === undefined &&
            payload.description === undefined &&
            payload.attachments === undefined,
          currentUrgencyLevel: existing.urgencyLevel,
          currentSeveritySourceType: existing.severitySourceType,
          currentSeverityJustification: existing.severityJustification,
        });
        const resolvedTriageDecision =
          payload.triageDecision === undefined || payload.triageDecision === null
            ? existing.triageDecision ??
              resolveDefaultTriageDecision(resolvedType, evaluatedSeverity.score)
            : payload.triageDecision;
        const severity = applyTriageDecisionToSeverity(
          evaluatedSeverity,
          resolvedTriageDecision,
        );
        const triageChanged =
          resolvedTriageDecision !== existing.triageDecision ||
          (payload.triageNotes !== undefined &&
            normalizeOptionalString(payload.triageNotes) !==
              existing.triageNotes);
        const triageTimestamp = triageChanged ? new Date() : existing.triagedAt;

        const updatedTicket = await tx.maintenanceTicket.update({
          where: { id },
          data: {
            propertyId: propertyContext?.property.id ?? existing.propertyId,
            tenantId: resolvedTenantId,
            assignedToUserId:
              resolvedAssignedToUserId === undefined
                ? existing.assignedToUserId
                : resolvedAssignedToUserId,
            title: payload.title?.trim() ?? existing.title,
            description: payload.description?.trim() ?? existing.description,
            type: resolvedType,
            urgencyLevel: severity.score,
            severitySourceType: severity.sourceType,
            severityJustification: severity.justification,
            triageDecision: resolvedTriageDecision,
            triageNotes:
              payload.triageNotes === undefined
                ? existing.triageNotes
                : normalizeOptionalString(payload.triageNotes),
            triagedAt: triageTimestamp,
            triagedByUserId: triageChanged
              ? context.actorUserId
              : existing.triagedByUserId,
            status:
              existing.status === MaintenanceTicketStatus.OPEN &&
              resolvedTriageDecision
                ? MaintenanceTicketStatus.TRIAGE
                : existing.status,
            internalNotes:
              payload.internalNotes === undefined
                ? existing.internalNotes
                : normalizeOptionalString(payload.internalNotes),
            propertyCodeSnapshot:
              propertyContext?.property.code ?? existing.propertyCodeSnapshot,
            propertyTitleSnapshot:
              propertyContext?.property.title ?? existing.propertyTitleSnapshot,
            addressSnapshot:
              propertyContext?.addressSummary ?? existing.addressSnapshot,
            ownerNameSnapshot:
              propertyContext?.owner.fullName ?? existing.ownerNameSnapshot,
            tenantNameSnapshot:
              resolvedTenantId === propertyContext?.activeTenant?.id
                ? propertyContext?.activeTenant?.fullName ?? null
                : await this.getTenantNameById(
                    tx,
                    resolvedTenantId ?? existing.tenantId,
                  ),
          },
          include: {
            openedByUser: {
              select: {
                id: true,
                fullName: true,
              },
            },
            assignedToUser: {
              select: {
                id: true,
                fullName: true,
              },
            },
            _count: {
              select: {
                history: true,
                documents: true,
              },
            },
          },
        });

        const changedFields: Record<string, unknown> = {};
        if (payload.title !== undefined && payload.title.trim() !== existing.title) {
          changedFields.title = {
            old: existing.title,
            new: payload.title.trim(),
          };
        }
        if (
          payload.description !== undefined &&
          payload.description.trim() !== existing.description
        ) {
          changedFields.description = {
            old: existing.description,
            new: payload.description.trim(),
          };
        }
        if (payload.propertyId && payload.propertyId !== existing.propertyId) {
          changedFields.propertyId = {
            old: existing.propertyId,
            new: payload.propertyId,
          };
        }
        if (payload.type && payload.type !== existing.type) {
          changedFields.type = {
            old: existing.type,
            new: payload.type,
          };
        }

        if (Object.keys(changedFields).length > 0) {
          const historyOldValue = toJsonObject(
            Object.fromEntries(
              Object.entries(changedFields).map(([key, value]) => [
                key,
                (value as { old: unknown }).old,
              ]),
            ),
          );
          const historyNewValue = toJsonObject(
            Object.fromEntries(
              Object.entries(changedFields).map(([key, value]) => [
                key,
                (value as { new: unknown }).new,
              ]),
            ),
          );

          await tx.maintenanceTicketHistory.create({
            data: {
              maintenanceTicketId: id,
              userId: context.actorUserId,
              actionType: MaintenanceTicketHistoryActionType.DETAILS_UPDATED,
              description: "Dados centrais do chamado foram atualizados.",
              oldValue: historyOldValue,
              newValue: historyNewValue,
            },
          });
        }

        if (triageChanged) {
          await tx.maintenanceTicketHistory.create({
            data: {
              maintenanceTicketId: id,
              userId: context.actorUserId,
              actionType: MaintenanceTicketHistoryActionType.TRIAGED,
              description: `Triagem atualizada para ${getMaintenanceTriageDecisionLabel(resolvedTriageDecision)}.`,
              oldValue: {
                triageDecision: existing.triageDecision,
                triageNotes: existing.triageNotes,
              },
              newValue: {
                triageDecision: resolvedTriageDecision,
                triageNotes:
                  payload.triageNotes === undefined
                    ? existing.triageNotes
                    : normalizeOptionalString(payload.triageNotes),
              },
            },
          });
        }

        if (
          resolvedAssignedToUserId !== undefined &&
          resolvedAssignedToUserId !== existing.assignedToUserId
        ) {
          await tx.maintenanceTicketHistory.create({
            data: {
              maintenanceTicketId: id,
              userId: context.actorUserId,
              actionType: MaintenanceTicketHistoryActionType.ASSIGNED,
              description: resolvedAssignedToUserId
                ? "Responsavel do chamado foi atualizado."
                : "Responsavel do chamado foi removido.",
              oldValue: { assignedToUserId: existing.assignedToUserId },
              newValue: { assignedToUserId: resolvedAssignedToUserId },
            },
          });
        }

        if (severity.score !== existing.urgencyLevel) {
          await tx.maintenanceTicketHistory.create({
            data: {
              maintenanceTicketId: id,
              userId: context.actorUserId,
              actionType: MaintenanceTicketHistoryActionType.URGENCY_CHANGED,
              description: "Grau de urgencia do chamado foi ajustado.",
              oldValue: { urgencyLevel: existing.urgencyLevel },
              newValue: {
                urgencyLevel: severity.score,
                severitySourceType: severity.sourceType,
                severityJustification: severity.justification,
              },
            },
          });
        }

        if (
          payload.internalNotes !== undefined &&
          normalizeOptionalString(payload.internalNotes) !== existing.internalNotes
        ) {
          await tx.maintenanceTicketHistory.create({
            data: {
              maintenanceTicketId: id,
              userId: context.actorUserId,
              actionType: MaintenanceTicketHistoryActionType.INTERNAL_NOTE_UPDATED,
              description: "Observacoes internas do chamado foram atualizadas.",
              oldValue: { internalNotes: existing.internalNotes },
              newValue: {
                internalNotes: normalizeOptionalString(payload.internalNotes),
              },
            },
          });
        }

        await this.syncAttachments(
          tx,
          id,
          payload.attachments ?? [],
          context.actorUserId,
        );

        if (
          payload.type !== undefined ||
          payload.description !== undefined ||
          payload.urgencyLevel !== undefined ||
          payload.triageDecision !== undefined
        ) {
          await this.registerSeverityAssessment(
            tx,
            id,
            severity,
            severity.sourceType === MaintenanceSeveritySourceType.MANUAL
              ? context.actorUserId
              : undefined,
          );
        }

        if (
          payload.urgencyLevel !== undefined &&
          payload.urgencyLevel !== null &&
          payload.urgencyLevel !== severity.automaticScore
        ) {
          await this.auditUrgencyOverride(id, existing.ticketId, context, {
            requestedUrgencyLevel: payload.urgencyLevel,
            automaticUrgencyLevel: severity.automaticScore,
            justification: severity.justification,
          });
        }

        await this.audit("maintenance.update", id, existing.ticketId, context, payload);

        return updatedTicket;
      });

      return mapTicketBase(ticket);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao atualizar chamado de manutencao.");
    }
  }

  async createFromPortal(
    payload: MaintenanceCreatePayload,
    context: RequestContext,
  ) {
    return this.create(
      {
        ...payload,
        openedViaTenantPortal: true,
      },
      context,
    );
  }

  async updateStatus(
    id: string,
    payload: MaintenanceStatusPayload,
    context: RequestContext,
  ) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessao invalida.");
    }

    try {
      const ticket = await prisma.$transaction(async (tx) => {
        const existing = await tx.maintenanceTicket.findUnique({
          where: { id },
          select: {
            id: true,
            ticketId: true,
            status: true,
            openedByUserId: true,
            assignedToUserId: true,
            internalNotes: true,
            resolutionSummary: true,
            cancelReason: true,
            resolvedAt: true,
            finishedAt: true,
          },
        });

        if (!existing) {
          throw new HttpError(404, "Chamado de manutencao nao encontrado.");
        }

        this.ensureTicketAccess(existing, context);

        if (
          isMaintenanceTerminalStatus(existing.status) &&
          existing.status !== payload.status &&
          !this.canOverride(context)
        ) {
          throw new HttpError(
            422,
            "Chamados finalizados ou cancelados nao podem ser reabertos sem autorizacao MASTER.",
          );
        }

        const resolutionSummary = normalizeOptionalString(
          payload.resolutionSummary,
        ) ?? existing.resolutionSummary;
        const cancelReason =
          normalizeOptionalString(payload.cancelReason) ?? existing.cancelReason;

        if (
          payload.status === MaintenanceTicketStatus.FINISHED &&
          !resolutionSummary
        ) {
          throw new HttpError(
            422,
            "Finalizacao exige um resumo de resolucao.",
          );
        }

        if (
          payload.status === MaintenanceTicketStatus.CANCELLED &&
          !cancelReason
        ) {
          throw new HttpError(422, "Cancelamento exige um motivo.");
        }

        const assignedToUserId = await this.resolveAssignedUserId(
          tx,
          payload.assignedToUserId,
        );
        const now = new Date();

        const updatedTicket = await tx.maintenanceTicket.update({
          where: { id },
          data: {
            status: payload.status,
            assignedToUserId:
              assignedToUserId === undefined
                ? existing.assignedToUserId
                : assignedToUserId,
            resolutionSummary,
            cancelReason,
            internalNotes:
              payload.internalNotes === undefined
                ? existing.internalNotes
                : normalizeOptionalString(payload.internalNotes),
            resolvedAt:
              payload.status === MaintenanceTicketStatus.RESOLVED ||
              payload.status === MaintenanceTicketStatus.FINISHED
                ? existing.resolvedAt ?? now
                : null,
            finishedAt:
              payload.status === MaintenanceTicketStatus.FINISHED
                ? existing.finishedAt ?? now
                : payload.status === MaintenanceTicketStatus.CANCELLED
                  ? null
                  : existing.finishedAt,
            lastStatusChangeAt: now,
          },
          include: {
            openedByUser: {
              select: {
                id: true,
                fullName: true,
              },
            },
            assignedToUser: {
              select: {
                id: true,
                fullName: true,
              },
            },
            _count: {
              select: {
                history: true,
                documents: true,
              },
            },
          },
        });

        await tx.maintenanceTicketHistory.create({
          data: {
            maintenanceTicketId: id,
            userId: context.actorUserId,
            actionType:
              payload.status === MaintenanceTicketStatus.CANCELLED
                ? MaintenanceTicketHistoryActionType.CANCELLED
                : MaintenanceTicketHistoryActionType.STATUS_CHANGED,
            description:
              payload.status === MaintenanceTicketStatus.CANCELLED
                ? "Chamado cancelado."
                : `Status alterado para ${getMaintenanceStatusLabel(payload.status)}.`,
            oldValue: { status: existing.status },
            newValue: {
              status: payload.status,
              resolutionSummary,
              cancelReason,
            },
          },
        });

        if (resolutionSummary && resolutionSummary !== existing.resolutionSummary) {
          await tx.maintenanceTicketHistory.create({
            data: {
              maintenanceTicketId: id,
              userId: context.actorUserId,
              actionType: MaintenanceTicketHistoryActionType.RESOLUTION_ADDED,
              description: "Resumo de resolucao registrado para o chamado.",
              oldValue: { resolutionSummary: existing.resolutionSummary },
              newValue: { resolutionSummary },
            },
          });
        }

        if (
          normalizeOptionalString(payload.internalNotes) &&
          normalizeOptionalString(payload.internalNotes) !== undefined
        ) {
          await tx.maintenanceTicketHistory.create({
            data: {
              maintenanceTicketId: id,
              userId: context.actorUserId,
              actionType: MaintenanceTicketHistoryActionType.INTERNAL_NOTE_UPDATED,
              description: "Observacao interna adicionada durante movimentacao do chamado.",
              newValue: {
                internalNotes: normalizeOptionalString(payload.internalNotes),
              },
            },
          });
        }

        if (
          assignedToUserId !== undefined &&
          assignedToUserId !== existing.assignedToUserId
        ) {
          await tx.maintenanceTicketHistory.create({
            data: {
              maintenanceTicketId: id,
              userId: context.actorUserId,
              actionType: MaintenanceTicketHistoryActionType.ASSIGNED,
              description: assignedToUserId
                ? "Responsavel do chamado foi atualizado."
                : "Responsavel do chamado foi removido.",
              oldValue: { assignedToUserId: existing.assignedToUserId },
              newValue: { assignedToUserId },
            },
          });
        }

        await this.audit(
          "maintenance.update-status",
          id,
          existing.ticketId,
          context,
          payload,
        );

        return updatedTicket;
      });

      return mapTicketBase(ticket);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao atualizar status do chamado.");
    }
  }

  async triage(
    id: string,
    payload: MaintenanceTriagePayload,
    context: RequestContext,
  ) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessao invalida.");
    }

    try {
      const ticket = await prisma.$transaction(async (tx) => {
        const existing = await tx.maintenanceTicket.findUnique({
          where: { id },
          select: {
            id: true,
            ticketId: true,
            status: true,
            urgencyLevel: true,
            severitySourceType: true,
            severityJustification: true,
            triageDecision: true,
            triageNotes: true,
            openedByUserId: true,
            assignedToUserId: true,
            resolvedAt: true,
            finishedAt: true,
          },
        });

        if (!existing) {
          throw new HttpError(404, "Chamado de manutencao nao encontrado.");
        }

        this.ensureTicketAccess(existing, context);

        if (isMaintenanceTerminalStatus(existing.status) && !this.canOverride(context)) {
          throw new HttpError(
            422,
            "Chamados finalizados ou cancelados nao podem ser triados sem autorizacao MASTER.",
          );
        }

        const assignedToUserId = await this.resolveAssignedUserId(
          tx,
          payload.assignedToUserId,
        );
        const nextStatus = resolveStatusForTriageDecision(payload.triageDecision);
        const nextUrgencyLevel =
          payload.triageDecision === MaintenanceTriageDecision.EMERGENCY
            ? Math.max(existing.urgencyLevel, 5)
            : payload.triageDecision === MaintenanceTriageDecision.NEEDS_QUOTE
              ? Math.max(existing.urgencyLevel, 3)
              : existing.urgencyLevel;
        const triageNotes =
          normalizeOptionalString(payload.triageNotes) ??
          `Classificacao operacional: ${getMaintenanceTriageDecisionLabel(payload.triageDecision)}.`;
        const now = new Date();

        const updatedTicket = await tx.maintenanceTicket.update({
          where: { id },
          data: {
            triageDecision: payload.triageDecision,
            triageNotes,
            triagedAt: now,
            triagedByUserId: context.actorUserId,
            status: nextStatus,
            urgencyLevel: nextUrgencyLevel,
            severityJustification:
              nextUrgencyLevel !== existing.urgencyLevel
                ? `${existing.severityJustification ?? "Avaliação operacional preservada."} Triagem ${getMaintenanceTriageDecisionLabel(payload.triageDecision).toLowerCase()} ajustou a prioridade para ${nextUrgencyLevel}/5.`
                : existing.severityJustification,
            assignedToUserId:
              assignedToUserId === undefined
                ? existing.assignedToUserId
                : assignedToUserId,
            resolvedAt: null,
            finishedAt: null,
            lastStatusChangeAt: now,
          },
          include: {
            openedByUser: {
              select: {
                id: true,
                fullName: true,
              },
            },
            assignedToUser: {
              select: {
                id: true,
                fullName: true,
              },
            },
            _count: {
              select: {
                history: true,
                documents: true,
              },
            },
          },
        });

        await tx.maintenanceTicketHistory.create({
          data: {
            maintenanceTicketId: id,
            userId: context.actorUserId,
            actionType: MaintenanceTicketHistoryActionType.TRIAGED,
            description: `Triagem classificada como ${getMaintenanceTriageDecisionLabel(payload.triageDecision)}.`,
            oldValue: {
              status: existing.status,
              urgencyLevel: existing.urgencyLevel,
              triageDecision: existing.triageDecision,
              triageNotes: existing.triageNotes,
              assignedToUserId: existing.assignedToUserId,
            },
            newValue: {
              status: nextStatus,
              urgencyLevel: nextUrgencyLevel,
              triageDecision: payload.triageDecision,
              triageNotes,
              assignedToUserId:
                assignedToUserId === undefined
                  ? existing.assignedToUserId
                  : assignedToUserId,
            },
          },
        });

        if (nextUrgencyLevel !== existing.urgencyLevel) {
          await tx.maintenanceTicketHistory.create({
            data: {
              maintenanceTicketId: id,
              userId: context.actorUserId,
              actionType: MaintenanceTicketHistoryActionType.URGENCY_CHANGED,
              description: "Prioridade ajustada pela triagem operacional.",
              oldValue: { urgencyLevel: existing.urgencyLevel },
              newValue: {
                urgencyLevel: nextUrgencyLevel,
                triageDecision: payload.triageDecision,
              },
            },
          });
        }

        if (
          assignedToUserId !== undefined &&
          assignedToUserId !== existing.assignedToUserId
        ) {
          await tx.maintenanceTicketHistory.create({
            data: {
              maintenanceTicketId: id,
              userId: context.actorUserId,
              actionType: MaintenanceTicketHistoryActionType.ASSIGNED,
              description: assignedToUserId
                ? "Responsavel definido durante a triagem."
                : "Responsavel removido durante a triagem.",
              oldValue: { assignedToUserId: existing.assignedToUserId },
              newValue: { assignedToUserId },
            },
          });
        }

        await this.audit("maintenance.triage", id, existing.ticketId, context, {
          triageDecision: payload.triageDecision,
          triageNotes,
          status: nextStatus,
          urgencyLevel: nextUrgencyLevel,
        });

        return updatedTicket;
      });

      return mapTicketBase(ticket);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao registrar triagem do chamado.");
    }
  }

  async getKanban(query: MaintenanceListQuery, context: RequestContext) {
    const {
      page: _page,
      pageSize: _pageSize,
      onlyCritical: _onlyCritical,
      ...filters
    } = query;
    const where = this.buildScopedWhere(filters, context);

    const tickets = await prisma.maintenanceTicket.findMany({
      where,
      orderBy: [{ urgencyLevel: "desc" }, { updatedAt: "asc" }],
      include: {
        openedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
        assignedToUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            history: true,
            documents: true,
          },
        },
      },
    });

    const mappedTickets = tickets.map(mapTicketBase);
    const columnStatuses = [
      MaintenanceTicketStatus.OPEN,
      MaintenanceTicketStatus.TRIAGE,
      MaintenanceTicketStatus.WAITING_APPROVAL,
      MaintenanceTicketStatus.WAITING_PROVIDER,
      MaintenanceTicketStatus.IN_PROGRESS,
      MaintenanceTicketStatus.WAITING_MATERIAL,
      MaintenanceTicketStatus.RESOLVED,
      MaintenanceTicketStatus.FINISHED,
      ...(query.status === MaintenanceTicketStatus.CANCELLED
        ? [MaintenanceTicketStatus.CANCELLED]
        : []),
    ];

    return {
      filtersApplied: query,
      columns: columnStatuses.map((status) => ({
        status,
        label: getMaintenanceStatusLabel(status),
        items: mappedTickets.filter((item) => item.status === status),
      })),
    };
  }

  async getDashboard(context: RequestContext) {
    const where = this.buildScopedWhere({}, context);
    const tickets = await prisma.maintenanceTicket.findMany({
      where,
      orderBy: [{ urgencyLevel: "desc" }, { createdAt: "asc" }],
      include: {
        openedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
        assignedToUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            history: true,
            documents: true,
          },
        },
      },
    });

    const now = new Date();
    const mappedTickets = tickets.map(mapTicketBase);
    const nonTerminalTickets = tickets.filter(
      (ticket) => !isMaintenanceTerminalStatus(ticket.status),
    );
    const resolvedTickets = tickets.filter(
      (ticket) =>
        ticket.finishedAt !== null ||
        ticket.resolvedAt !== null ||
        ticket.status === MaintenanceTicketStatus.RESOLVED,
    );

    const averageResolutionHours =
      resolvedTickets.length > 0
        ? Number(
            (
              resolvedTickets.reduce((accumulator, ticket) => {
                const endDate =
                  ticket.finishedAt ?? ticket.resolvedAt ?? ticket.updatedAt;
                return (
                  accumulator +
                  (endDate.getTime() - ticket.createdAt.getTime()) /
                    (1000 * 60 * 60)
                );
              }, 0) / resolvedTickets.length
            ).toFixed(1),
          )
        : 0;

    const lastSevenDays = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const start = getStartOfDay(date);
      const end = getEndOfDay(date);

      const dayTickets = tickets.filter(
        (ticket) => ticket.createdAt >= start && ticket.createdAt <= end,
      );

      return {
        date: start,
        open: dayTickets.filter(
          (ticket) => resolveStatusBucket(ticket.status) === "open",
        ).length,
        inProgress: dayTickets.filter(
          (ticket) => resolveStatusBucket(ticket.status) === "inProgress",
        ).length,
        finished: dayTickets.filter(
          (ticket) => resolveStatusBucket(ticket.status) === "finished",
        ).length,
      };
    });

    return {
      indicators: {
        totalOpen: nonTerminalTickets.length,
        inProgress: tickets.filter(
          (ticket) => resolveStatusBucket(ticket.status) === "inProgress",
        ).length,
        resolved: tickets.filter(
          (ticket) => ticket.status === MaintenanceTicketStatus.RESOLVED,
        ).length,
        finished: tickets.filter(
          (ticket) => ticket.status === MaintenanceTicketStatus.FINISHED,
        ).length,
        cancelled: tickets.filter(
          (ticket) => ticket.status === MaintenanceTicketStatus.CANCELLED,
        ).length,
        overdueCount: mappedTickets.filter((ticket) => ticket.isOverdue).length,
        triageCount: tickets.filter(
          (ticket) => ticket.status === MaintenanceTicketStatus.TRIAGE,
        ).length,
        unassignedCount: nonTerminalTickets.filter(
          (ticket) => !ticket.assignedToUserId,
        ).length,
        emergencyCount: nonTerminalTickets.filter(
          (ticket) =>
            ticket.triageDecision === MaintenanceTriageDecision.EMERGENCY ||
            ticket.urgencyLevel === 5,
        ).length,
        averageResolutionHours,
      },
      charts: {
        status: [
          {
            key: "open",
            label: "Aberto",
            value: tickets.filter(
              (ticket) => resolveStatusBucket(ticket.status) === "open",
            ).length,
          },
          {
            key: "inProgress",
            label: "Em andamento",
            value: tickets.filter(
              (ticket) => resolveStatusBucket(ticket.status) === "inProgress",
            ).length,
          },
          {
            key: "finished",
            label: "Finalizado",
            value: tickets.filter(
              (ticket) => resolveStatusBucket(ticket.status) === "finished",
            ).length,
          },
          {
            key: "cancelled",
            label: "Cancelado",
            value: tickets.filter(
              (ticket) => resolveStatusBucket(ticket.status) === "cancelled",
            ).length,
          },
        ],
        urgency: [1, 2, 3, 4, 5].map((urgencyLevel) => ({
          key: String(urgencyLevel),
          label: getMaintenanceUrgencyLabel(urgencyLevel),
          value: tickets.filter((ticket) => ticket.urgencyLevel === urgencyLevel)
            .length,
        })),
        types: Array.from(
          tickets.reduce<Map<MaintenanceTicketType, number>>((accumulator, ticket) => {
            accumulator.set(
              ticket.type,
              (accumulator.get(ticket.type) ?? 0) + 1,
            );
            return accumulator;
          }, new Map()),
        )
          .map(([type, value]) => ({
            key: type,
            label: getMaintenanceTypeLabel(type),
            value,
          }))
          .sort((left, right) => right.value - left.value),
        evolution: lastSevenDays,
        averageResolutionByUrgency: [1, 2, 3, 4, 5].map((urgencyLevel) => {
          const urgencyTickets = resolvedTickets.filter(
            (ticket) => ticket.urgencyLevel === urgencyLevel,
          );
          const averageHours =
            urgencyTickets.length > 0
              ? Number(
                  (
                    urgencyTickets.reduce((accumulator, ticket) => {
                      const endDate =
                        ticket.finishedAt ?? ticket.resolvedAt ?? ticket.updatedAt;
                      return (
                        accumulator +
                        (endDate.getTime() - ticket.createdAt.getTime()) /
                          (1000 * 60 * 60)
                      );
                    }, 0) / urgencyTickets.length
                  ).toFixed(1),
                )
              : 0;

          return {
            key: String(urgencyLevel),
            label: getMaintenanceUrgencyLabel(urgencyLevel),
            value: averageHours,
          };
        }),
      },
      byProperty: Array.from(
        tickets.reduce<Map<string, { label: string; value: number }>>(
          (accumulator, ticket) => {
            const key = ticket.propertyId;
            const current = accumulator.get(key);
            accumulator.set(key, {
              label: `${ticket.propertyCodeSnapshot} - ${ticket.propertyTitleSnapshot}`,
              value: (current?.value ?? 0) + 1,
            });
            return accumulator;
          },
          new Map(),
        ),
      )
        .map(([key, value]) => ({
          key,
          label: value.label,
          value: value.value,
        }))
        .sort((left, right) => right.value - left.value)
        .slice(0, 6),
      criticalTickets: mappedTickets
        .filter(
          (ticket) =>
            ticket.urgencyLevel === 5 ||
            ticket.triageDecision === MaintenanceTriageDecision.EMERGENCY ||
            ticket.isOverdue ||
            !ticket.assignedToUser ||
            ticket.daysWithoutUpdate >= 2,
        )
        .slice(0, 10),
      refreshedAt: now,
    };
  }

  private buildScopedWhere(
    query: Omit<MaintenanceListQuery, "page" | "pageSize" | "onlyCritical">,
    context: RequestContext,
  ): Prisma.MaintenanceTicketWhereInput {
    const baseWhere: Prisma.MaintenanceTicketWhereInput = {
      ...(query.search
        ? {
            OR: [
              { ticketId: { contains: query.search, mode: "insensitive" } },
              { title: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
              {
                propertyCodeSnapshot: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
              {
                propertyTitleSnapshot: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
              {
                tenantNameSnapshot: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.triageDecision
        ? { triageDecision: query.triageDecision }
        : {}),
      ...(query.urgencyLevel ? { urgencyLevel: query.urgencyLevel } : {}),
      ...(query.assignedToUserId
        ? { assignedToUserId: query.assignedToUserId }
        : {}),
      ...(query.openedByUserId ? { openedByUserId: query.openedByUserId } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: getStartOfDay(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: getEndOfDay(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    if (this.canOverride(context)) {
      return baseWhere;
    }

    if (!context.actorUserId) {
      throw new HttpError(401, "Sessao invalida.");
    }

    return {
      AND: [
        baseWhere,
        {
          OR: [
            { openedByUserId: context.actorUserId },
            { assignedToUserId: context.actorUserId },
          ],
        },
      ],
    };
  }

  private async resolvePropertyContext(
    tx: Tx | typeof prisma,
    input: { propertyId?: string; propertyCode?: string },
  ): Promise<ResolvedPropertyContext> {
    const property = input.propertyId
      ? await tx.property.findUnique({
          where: { id: input.propertyId },
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
              },
            },
            contracts: {
              where: {
                status: {
                  in: [ContractStatus.ACTIVE, ContractStatus.RENEWED],
                },
              },
              orderBy: [{ activatedAt: "desc" }, { startDate: "desc" }],
              take: 1,
              include: {
                tenant: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        })
      : await tx.property.findUnique({
          where: {
            code: input.propertyCode?.trim().toUpperCase(),
          },
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
              },
            },
            contracts: {
              where: {
                status: {
                  in: [ContractStatus.ACTIVE, ContractStatus.RENEWED],
                },
              },
              orderBy: [{ activatedAt: "desc" }, { startDate: "desc" }],
              take: 1,
              include: {
                tenant: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        });

    if (!property) {
      throw new HttpError(404, "Imovel informado nao foi encontrado.");
    }

    return {
      property: {
        id: property.id,
        code: property.code,
        title: property.title,
        street: property.street,
        streetNumber: property.streetNumber,
        district: property.district,
        city: property.city,
        state: property.state,
      },
      owner: property.owner,
      activeTenant: property.contracts[0]?.tenant ?? null,
      addressSummary: buildAddressSummary(property),
    };
  }

  private async resolveAssignedUserId(
    tx: Tx | typeof prisma,
    assignedToUserId?: string | null,
  ) {
    if (assignedToUserId === undefined) {
      return undefined;
    }

    if (assignedToUserId === null) {
      return null;
    }

    const user = await tx.user.findUnique({
      where: { id: assignedToUserId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new HttpError(
        422,
        "Responsavel informado nao esta disponivel para assumir o chamado.",
      );
    }

    return user.id;
  }

  private async resolveTenantId(
    tx: Tx | typeof prisma,
    requestedTenantId: string | null | undefined,
    activeTenantId: string | null,
    canOverride: boolean,
  ) {
    if (requestedTenantId === undefined) {
      return activeTenantId;
    }

    if (requestedTenantId === null) {
      if (activeTenantId && !canOverride) {
        throw new HttpError(
          422,
          "O locatario ativo do imovel deve ser preservado neste chamado.",
        );
      }

      return null;
    }

    if (activeTenantId && requestedTenantId !== activeTenantId && !canOverride) {
      throw new HttpError(
        403,
        "Ajuste manual de locatario exige permissao MASTER.",
      );
    }

    const tenant = await tx.tenant.findUnique({
      where: { id: requestedTenantId },
      select: {
        id: true,
      },
    });

    if (!tenant) {
      throw new HttpError(404, "Locatario informado nao foi encontrado.");
    }

    return tenant.id;
  }

  private async getTenantNameById(
    tx: Tx | typeof prisma,
    tenantId?: string | null,
  ) {
    if (!tenantId) {
      return null;
    }

    const tenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: {
        fullName: true,
      },
    });

    return tenant?.fullName ?? null;
  }

  private async evaluateSeverity(input: {
    type: MaintenanceTicketType;
    description: string;
    attachments: AttachmentInput[];
    requestedUrgencyLevel?: number | null;
    canOverride: boolean;
    preserveWhenUnchanged?: boolean;
    currentUrgencyLevel?: number;
    currentSeveritySourceType?: MaintenanceSeveritySourceType;
    currentSeverityJustification?: string | null;
  }) {
    if (input.preserveWhenUnchanged) {
      return {
        score: input.currentUrgencyLevel ?? 1,
        automaticScore: input.currentUrgencyLevel ?? 1,
        justification:
          input.currentSeverityJustification ??
          "Classificação preservada da avaliação anterior.",
        sourceType:
          input.currentSeveritySourceType ?? MaintenanceSeveritySourceType.RULE,
      };
    }

    const automaticSeverity = await maintenanceSeverityEvaluator.evaluate({
      type: input.type,
      description: input.description,
      attachmentCount: input.attachments.length,
    });

    if (
      input.requestedUrgencyLevel === undefined ||
      input.requestedUrgencyLevel === null ||
      input.requestedUrgencyLevel === automaticSeverity.score
    ) {
      return {
        ...automaticSeverity,
        automaticScore: automaticSeverity.score,
      };
    }

    if (!input.canOverride) {
      throw new HttpError(
        403,
        "Alteracao manual de urgencia exige permissao MASTER.",
      );
    }

    return {
      score: input.requestedUrgencyLevel,
      automaticScore: automaticSeverity.score,
      justification: `Classificação manual aplicada a partir da avaliação automática (${automaticSeverity.score}/5). ${automaticSeverity.justification}`,
      sourceType: MaintenanceSeveritySourceType.MANUAL,
    };
  }

  private async registerSeverityAssessment(
    tx: Tx,
    maintenanceTicketId: string,
    severity: MaintenanceSeverityResult,
    evaluatedByUserId?: string,
  ) {
    await tx.maintenanceSeverityAssessment.create({
      data: {
        maintenanceTicketId,
        sourceType: severity.sourceType,
        score: severity.score,
        justification: severity.justification,
        evaluatedByUserId: evaluatedByUserId ?? null,
      },
    });
  }

  private async generateTicketId(tx: Tx | typeof prisma) {
    const year = new Date().getFullYear();
    const prefix = `MNT-${year}-`;
    const latestTicket = await tx.maintenanceTicket.findFirst({
      where: {
        ticketId: {
          startsWith: prefix,
        },
      },
      orderBy: {
        ticketId: "desc",
      },
      select: {
        ticketId: true,
      },
    });

    const currentSequence = latestTicket
      ? Number(latestTicket.ticketId.slice(-6))
      : 0;

    return `${prefix}${String(currentSequence + 1).padStart(6, "0")}`;
  }

  private async syncAttachments(
    tx: Tx,
    maintenanceTicketId: string,
    attachments: AttachmentInput[],
    uploadedByUserId?: string,
  ) {
    if (!uploadedByUserId || attachments.length === 0) {
      return;
    }

    const existingAttachments = await tx.document.findMany({
      where: {
        maintenanceTicketId,
        category: DocumentCategory.MAINTENANCE_ATTACHMENT,
        fileUrl: {
          in: attachments.map((item) => item.fileUrl),
        },
      },
      select: {
        fileUrl: true,
      },
    });

    const existingUrls = new Set(existingAttachments.map((item) => item.fileUrl));
    const attachmentsToCreate = attachments.filter(
      (item) => !existingUrls.has(item.fileUrl),
    );

    if (attachmentsToCreate.length === 0) {
      return;
    }

    await tx.document.createMany({
      data: attachmentsToCreate.map((item) => ({
        name: item.name,
        fileUrl: item.fileUrl,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        category: DocumentCategory.MAINTENANCE_ATTACHMENT,
        maintenanceTicketId,
        uploadedByUserId,
      })),
    });

    await tx.maintenanceTicketHistory.create({
      data: {
        maintenanceTicketId,
        userId: uploadedByUserId,
        actionType: MaintenanceTicketHistoryActionType.ATTACHMENT_ADDED,
        description: `${attachmentsToCreate.length} anexo(s) adicionado(s) ao chamado.`,
        newValue: {
          attachments: attachmentsToCreate.map((item) => ({
            name: item.name,
            fileUrl: item.fileUrl,
          })),
        },
      },
    });
  }

  private canOverride(context: RequestContext) {
    return Boolean(
      context.roles?.includes(roleCodes.MASTER_ADMIN) ||
        context.permissions?.includes(permissionCodes.MAINTENANCE_OVERRIDE),
    );
  }

  private ensureTicketAccess(
    ticket: {
      openedByUserId: string;
      assignedToUserId?: string | null;
    },
    context: RequestContext,
  ) {
    if (this.canOverride(context)) {
      return;
    }

    if (!context.actorUserId) {
      throw new HttpError(401, "Sessao invalida.");
    }

    if (
      ticket.openedByUserId !== context.actorUserId &&
      ticket.assignedToUserId !== context.actorUserId
    ) {
      throw new HttpError(
        403,
        "Voce nao possui acesso a este chamado de manutencao.",
      );
    }
  }

  private isCriticalTicket(ticket: {
    urgencyLevel: number;
    assignedToUserId?: string | null;
    triageDecision?: MaintenanceTriageDecision | null;
    status: MaintenanceTicketStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return (
      ticket.urgencyLevel === 5 ||
      ticket.triageDecision === MaintenanceTriageDecision.EMERGENCY ||
      !ticket.assignedToUserId ||
      (!isMaintenanceTerminalStatus(ticket.status) &&
        resolveSlaDueDate(ticket.createdAt, ticket.urgencyLevel) < new Date()) ||
      (!isMaintenanceTerminalStatus(ticket.status) &&
        getDaysSinceLastUpdate(ticket.updatedAt) >= 2)
    );
  }

  private async audit(
    action: string,
    entityId: string,
    ticketId: string,
    context: RequestContext,
    metadata: unknown,
  ) {
    await createAuditLog({
      actorUserId: context.actorUserId,
      action,
      entityType: AuditEntityType.MAINTENANCE_TICKET,
      entityId,
      description: `Chamado ${ticketId} recebeu movimentacao operacional.`,
      metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  private async auditUrgencyOverride(
    entityId: string,
    ticketId: string,
    context: RequestContext,
    metadata: unknown,
  ) {
    await createAuditLog({
      actorUserId: context.actorUserId,
      action: "maintenance.override-urgency",
      entityType: AuditEntityType.MAINTENANCE_TICKET,
      entityId,
      description: `Urgencia do chamado ${ticketId} foi alterada manualmente.`,
      metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}
