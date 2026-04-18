import { AuditEntityType, Prisma } from "@prisma/client";
import { prisma } from "../../core/prisma";
import { HttpError } from "../../core/http-error";
import { buildPaginationMeta, resolvePagination } from "../../core/pagination";
import { createAuditLog } from "../../core/audit";
import { rethrowPrismaError } from "../../core/prisma-error";

type TenantsListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  scoreStatus?: string;
};

type RequestContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

type TenantPayload = {
  fullName: string;
  document: string;
  email?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  zipCode?: string | null;
  state?: string | null;
  city?: string | null;
  district?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  complement?: string | null;
  scoreStatus:
    | "NOT_ANALYZED"
    | "APPROVED"
    | "RESTRICTED"
    | "REJECTED"
    | "UNDER_REVIEW";
  scoreValue?: number | null;
  notes?: string | null;
  isActive: boolean;
};

function normalizeOptionalString(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function mapTenantBase(tenant: {
  id: string;
  fullName: string;
  document: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  scoreStatus: string;
  scoreValue: number | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    contracts: number;
    rentLeads: number;
  };
}) {
  return {
    id: tenant.id,
    fullName: tenant.fullName,
    document: tenant.document,
    email: tenant.email,
    phone: tenant.phone,
    city: tenant.city,
    state: tenant.state,
    scoreStatus: tenant.scoreStatus,
    scoreValue: tenant.scoreValue,
    isActive: tenant.isActive,
    createdAt: tenant.createdAt,
    contractCount: tenant._count.contracts,
    rentLeadCount: tenant._count.rentLeads,
  };
}

export class TenantsService {
  async list(query: TenantsListQuery) {
    const { page, pageSize, skip, take } = resolvePagination(query);
    const where: Prisma.TenantWhereInput = {
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: "insensitive" } },
              { document: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.scoreStatus ? { scoreStatus: query.scoreStatus as never } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              contracts: true,
              rentLeads: true,
            },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    return {
      data: items.map(mapTenantBase),
      meta: buildPaginationMeta(total, page, pageSize),
    };
  }

  async getById(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contracts: true,
            rentLeads: true,
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
            property: {
              select: {
                code: true,
                title: true,
              },
            },
            owner: {
              select: {
                fullName: true,
              },
            },
          },
        },
        rentLeads: {
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            code: true,
            pipelineStage: true,
            status: true,
            property: {
              select: {
                code: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new HttpError(404, "Locatario nao encontrado.");
    }

    return {
      ...tenant,
      contractCount: tenant._count.contracts,
      rentLeadCount: tenant._count.rentLeads,
      contracts: tenant.contracts.map((contract) => ({
        ...contract,
        rentAmount: Number(contract.rentAmount),
      })),
    };
  }

  async create(payload: TenantPayload, context: RequestContext) {
    try {
      const tenant = await prisma.tenant.create({
        data: this.toPrismaData(payload),
        include: {
          _count: {
            select: {
              contracts: true,
              rentLeads: true,
            },
          },
        },
      });

      await this.audit("tenants.create", tenant.id, payload.fullName, context, payload);

      return mapTenantBase(tenant);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao criar locatario.");
    }
  }

  async update(id: string, payload: TenantPayload, context: RequestContext) {
    try {
      const tenant = await prisma.tenant.update({
        where: { id },
        data: this.toPrismaData(payload),
        include: {
          _count: {
            select: {
              contracts: true,
              rentLeads: true,
            },
          },
        },
      });

      await this.audit("tenants.update", id, payload.fullName, context, payload);

      return mapTenantBase(tenant);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao atualizar locatario.");
    }
  }

  private toPrismaData(payload: TenantPayload): Prisma.TenantUncheckedCreateInput {
    return {
      fullName: payload.fullName.trim(),
      document: payload.document.trim(),
      email: normalizeOptionalString(payload.email),
      phone: normalizeOptionalString(payload.phone),
      secondaryPhone: normalizeOptionalString(payload.secondaryPhone),
      zipCode: normalizeOptionalString(payload.zipCode),
      state: normalizeOptionalString(payload.state),
      city: normalizeOptionalString(payload.city),
      district: normalizeOptionalString(payload.district),
      street: normalizeOptionalString(payload.street),
      streetNumber: normalizeOptionalString(payload.streetNumber),
      complement: normalizeOptionalString(payload.complement),
      scoreStatus: payload.scoreStatus,
      scoreValue: payload.scoreValue ?? null,
      notes: normalizeOptionalString(payload.notes),
      isActive: payload.isActive,
    };
  }

  private async audit(
    action: string,
    entityId: string,
    tenantName: string,
    context: RequestContext,
    metadata: unknown,
  ) {
    await createAuditLog({
      actorUserId: context.actorUserId,
      action,
      entityType: AuditEntityType.TENANT,
      entityId,
      description: `${tenantName} foi alterado no cadastro de locatarios.`,
      metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}

