import { AuditEntityType, Prisma } from "@prisma/client";
import { prisma } from "../../core/prisma";
import { HttpError } from "../../core/http-error";
import { buildPaginationMeta, resolvePagination } from "../../core/pagination";
import { createAuditLog } from "../../core/audit";
import { rethrowPrismaError } from "../../core/prisma-error";

type OwnersListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
};

type RequestContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

type OwnerPayload = {
  personType: "INDIVIDUAL" | "COMPANY";
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
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccount?: string | null;
  pixKey?: string | null;
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

function mapOwnerBase(owner: {
  id: string;
  personType: string;
  fullName: string;
  document: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    properties: number;
    contracts: number;
  };
}) {
  return {
    id: owner.id,
    personType: owner.personType,
    fullName: owner.fullName,
    document: owner.document,
    email: owner.email,
    phone: owner.phone,
    city: owner.city,
    state: owner.state,
    isActive: owner.isActive,
    createdAt: owner.createdAt,
    propertyCount: owner._count.properties,
    contractCount: owner._count.contracts,
  };
}

export class OwnersService {
  async list(query: OwnersListQuery) {
    const { page, pageSize, skip, take } = resolvePagination(query);
    const where: Prisma.OwnerWhereInput = {
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
    };

    const [items, total] = await Promise.all([
      prisma.owner.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              properties: true,
              contracts: true,
            },
          },
        },
      }),
      prisma.owner.count({ where }),
    ]);

    return {
      data: items.map(mapOwnerBase),
      meta: buildPaginationMeta(total, page, pageSize),
    };
  }

  async getById(id: string) {
    const owner = await prisma.owner.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            properties: true,
            contracts: true,
          },
        },
        properties: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            code: true,
            title: true,
            type: true,
            purpose: true,
            status: true,
            city: true,
            district: true,
            salePrice: true,
            rentPrice: true,
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
            tenant: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!owner) {
      throw new HttpError(404, "Proprietario nao encontrado.");
    }

    return {
      ...owner,
      propertyCount: owner._count.properties,
      contractCount: owner._count.contracts,
      properties: owner.properties.map((property) => ({
        ...property,
        salePrice: property.salePrice ? Number(property.salePrice) : null,
        rentPrice: property.rentPrice ? Number(property.rentPrice) : null,
      })),
      contracts: owner.contracts.map((contract) => ({
        ...contract,
        rentAmount: Number(contract.rentAmount),
      })),
    };
  }

  async create(payload: OwnerPayload, context: RequestContext) {
    try {
      const owner = await prisma.owner.create({
        data: this.toPrismaData(payload),
        include: {
          _count: {
            select: {
              properties: true,
              contracts: true,
            },
          },
        },
      });

      await this.audit("owners.create", owner.id, payload.fullName, context, payload);

      return mapOwnerBase(owner);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao criar proprietario.");
    }
  }

  async update(id: string, payload: OwnerPayload, context: RequestContext) {
    try {
      const owner = await prisma.owner.update({
        where: { id },
        data: this.toPrismaData(payload),
        include: {
          _count: {
            select: {
              properties: true,
              contracts: true,
            },
          },
        },
      });

      await this.audit("owners.update", id, payload.fullName, context, payload);

      return mapOwnerBase(owner);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao atualizar proprietario.");
    }
  }

  private toPrismaData(payload: OwnerPayload): Prisma.OwnerUncheckedCreateInput {
    return {
      personType: payload.personType,
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
      bankName: normalizeOptionalString(payload.bankName),
      bankBranch: normalizeOptionalString(payload.bankBranch),
      bankAccount: normalizeOptionalString(payload.bankAccount),
      pixKey: normalizeOptionalString(payload.pixKey),
      notes: normalizeOptionalString(payload.notes),
      isActive: payload.isActive,
    };
  }

  private async audit(
    action: string,
    entityId: string,
    ownerName: string,
    context: RequestContext,
    metadata: unknown,
  ) {
    await createAuditLog({
      actorUserId: context.actorUserId,
      action,
      entityType: AuditEntityType.OWNER,
      entityId,
      description: `${ownerName} foi alterado no cadastro de proprietarios.`,
      metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}

