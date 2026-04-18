import { AuditEntityType, Prisma } from "@prisma/client";
import { prisma } from "../../core/prisma";
import { HttpError } from "../../core/http-error";
import { buildPaginationMeta, resolvePagination } from "../../core/pagination";
import { createAuditLog } from "../../core/audit";
import { rethrowPrismaError } from "../../core/prisma-error";

type PropertiesListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  ownerId?: string;
  purpose?: string;
  status?: string;
  city?: string;
};

type RequestContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

type PropertyPayload = {
  code?: string | null;
  title: string;
  type:
    | "APARTMENT"
    | "HOUSE"
    | "COMMERCIAL"
    | "LAND"
    | "PENTHOUSE"
    | "WAREHOUSE"
    | "RURAL"
    | "OTHER";
  purpose: "SALE" | "RENT" | "BOTH";
  status:
    | "AVAILABLE"
    | "RESERVED"
    | "RENTED"
    | "SOLD"
    | "UNDER_MAINTENANCE"
    | "INACTIVE";
  commercialSituation:
    | "AVAILABLE_FOR_SALE"
    | "AVAILABLE_FOR_RENT"
    | "AVAILABLE_FOR_BOTH"
    | "SALE_IN_NEGOTIATION"
    | "RENT_IN_NEGOTIATION"
    | "RENTED"
    | "SOLD"
    | "INACTIVE";
  ownerId: string;
  zipCode: string;
  state: string;
  city: string;
  district: string;
  street: string;
  streetNumber: string;
  complement?: string | null;
  description?: string | null;
  internalNotes?: string | null;
  salePrice?: number | null;
  rentPrice?: number | null;
  condoFee?: number | null;
  iptu?: number | null;
  areaTotal?: number | null;
  areaBuilt?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  suites?: number | null;
  parkingSpots?: number | null;
  floor?: number | null;
  furnished: boolean;
  acceptsPet?: boolean | null;
  isPublished: boolean;
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

function mapPropertyBase(property: {
  id: string;
  code: string;
  title: string;
  type: string;
  purpose: string;
  status: string;
  commercialSituation: string;
  city: string;
  district: string;
  salePrice: Prisma.Decimal | null;
  rentPrice: Prisma.Decimal | null;
  isPublished: boolean;
  owner: { id: string; fullName: string };
  _count: {
    contracts: number;
    visits: number;
    propertyKeys: number;
  };
}) {
  return {
    id: property.id,
    code: property.code,
    title: property.title,
    type: property.type,
    purpose: property.purpose,
    status: property.status,
    commercialSituation: property.commercialSituation,
    city: property.city,
    district: property.district,
    salePrice: toNumber(property.salePrice),
    rentPrice: toNumber(property.rentPrice),
    isPublished: property.isPublished,
    owner: property.owner,
    contractCount: property._count.contracts,
    visitCount: property._count.visits,
    keyCount: property._count.propertyKeys,
  };
}

export class PropertiesService {
  async list(query: PropertiesListQuery) {
    const { page, pageSize, skip, take } = resolvePagination(query);
    const where: Prisma.PropertyWhereInput = {
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { code: { contains: query.search, mode: "insensitive" } },
              { street: { contains: query.search, mode: "insensitive" } },
              { district: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.purpose ? { purpose: query.purpose as never } : {}),
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.city
        ? { city: { contains: query.city, mode: "insensitive" } }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              contracts: true,
              visits: true,
              propertyKeys: true,
            },
          },
        },
      }),
      prisma.property.count({ where }),
    ]);

    return {
      data: items.map(mapPropertyBase),
      meta: buildPaginationMeta(total, page, pageSize),
    };
  }

  async getById(id: string) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: true,
        _count: {
          select: {
            contracts: true,
            visits: true,
            propertyKeys: true,
            saleLeads: true,
            rentLeads: true,
          },
        },
        propertyKeys: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            identifier: true,
            currentStatus: true,
            currentHolderName: true,
            lastCheckoutAt: true,
          },
        },
        visits: {
          orderBy: { scheduledAt: "desc" },
          take: 8,
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            outcome: true,
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
            tenant: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!property) {
      throw new HttpError(404, "Imovel nao encontrado.");
    }

    return {
      ...property,
      salePrice: toNumber(property.salePrice),
      rentPrice: toNumber(property.rentPrice),
      condoFee: toNumber(property.condoFee),
      iptu: toNumber(property.iptu),
      areaTotal: toNumber(property.areaTotal),
      areaBuilt: toNumber(property.areaBuilt),
      contracts: property.contracts.map((contract) => ({
        ...contract,
        rentAmount: Number(contract.rentAmount),
      })),
      metrics: {
        contractCount: property._count.contracts,
        visitCount: property._count.visits,
        keyCount: property._count.propertyKeys,
        saleLeadCount: property._count.saleLeads,
        rentLeadCount: property._count.rentLeads,
      },
    };
  }

  async create(payload: PropertyPayload, context: RequestContext) {
    await this.ensureOwnerExists(payload.ownerId);
    this.validateBusinessRules(payload);

    try {
      const property = await prisma.property.create({
        data: this.toPrismaData(payload),
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              contracts: true,
              visits: true,
              propertyKeys: true,
            },
          },
        },
      });

      await this.audit("properties.create", property.id, property.code, context, payload);

      return mapPropertyBase(property);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao criar imovel.");
    }
  }

  async update(id: string, payload: PropertyPayload, context: RequestContext) {
    await this.ensureOwnerExists(payload.ownerId);
    this.validateBusinessRules(payload);

    try {
      const property = await prisma.property.update({
        where: { id },
        data: this.toPrismaData(payload),
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              contracts: true,
              visits: true,
              propertyKeys: true,
            },
          },
        },
      });

      await this.audit("properties.update", property.id, property.code, context, payload);

      return mapPropertyBase(property);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao atualizar imovel.");
    }
  }

  private validateBusinessRules(payload: PropertyPayload) {
    if (
      payload.status === "RENTED" &&
      ["AVAILABLE_FOR_RENT", "AVAILABLE_FOR_BOTH"].includes(
        payload.commercialSituation,
      )
    ) {
      throw new HttpError(
        422,
        "Imovel alugado nao pode permanecer disponivel para locacao.",
      );
    }

    if (
      payload.status === "SOLD" &&
      ["AVAILABLE_FOR_SALE", "AVAILABLE_FOR_BOTH"].includes(
        payload.commercialSituation,
      )
    ) {
      throw new HttpError(
        422,
        "Imovel vendido nao pode permanecer disponivel para venda.",
      );
    }
  }

  private async ensureOwnerExists(ownerId: string) {
    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      select: { id: true },
    });

    if (!owner) {
      throw new HttpError(404, "Proprietario vinculado nao encontrado.");
    }
  }

  private buildCode(payload: PropertyPayload) {
    if (payload.code && payload.code.trim().length > 0) {
      return payload.code.trim().toUpperCase();
    }

    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `IMV-${suffix}`;
  }

  private toPrismaData(payload: PropertyPayload): Prisma.PropertyUncheckedCreateInput {
    return {
      code: this.buildCode(payload),
      title: payload.title.trim(),
      type: payload.type,
      purpose: payload.purpose,
      status: payload.status,
      commercialSituation: payload.commercialSituation,
      ownerId: payload.ownerId,
      zipCode: payload.zipCode.trim(),
      state: payload.state.trim().toUpperCase(),
      city: payload.city.trim(),
      district: payload.district.trim(),
      street: payload.street.trim(),
      streetNumber: payload.streetNumber.trim(),
      complement: normalizeOptionalString(payload.complement),
      description: normalizeOptionalString(payload.description),
      internalNotes: normalizeOptionalString(payload.internalNotes),
      salePrice: payload.salePrice ?? null,
      rentPrice: payload.rentPrice ?? null,
      condoFee: payload.condoFee ?? null,
      iptu: payload.iptu ?? null,
      areaTotal: payload.areaTotal ?? null,
      areaBuilt: payload.areaBuilt ?? null,
      bedrooms: payload.bedrooms ?? null,
      bathrooms: payload.bathrooms ?? null,
      suites: payload.suites ?? null,
      parkingSpots: payload.parkingSpots ?? null,
      floor: payload.floor ?? null,
      furnished: payload.furnished,
      acceptsPet: payload.acceptsPet ?? null,
      isPublished: payload.isPublished,
    };
  }

  private async audit(
    action: string,
    entityId: string,
    propertyCode: string,
    context: RequestContext,
    metadata: unknown,
  ) {
    await createAuditLog({
      actorUserId: context.actorUserId,
      action,
      entityType: AuditEntityType.PROPERTY,
      entityId,
      description: `Imovel ${propertyCode} foi alterado no cadastro de ativos.`,
      metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}

