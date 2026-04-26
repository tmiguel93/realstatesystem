import { AuditEntityType, ContractStatus, Prisma } from "@prisma/client";
import { permissionCodes } from "@imobiliaria/shared";
import { prisma } from "../../core/prisma";
import { HttpError } from "../../core/http-error";
import { buildPaginationMeta, resolvePagination } from "../../core/pagination";
import { createAuditLog } from "../../core/audit";
import { rethrowPrismaError } from "../../core/prisma-error";
import { storageAdapter } from "../../shared/storage/local-storage-adapter";

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
  permissions?: string[];
  roles?: string[];
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

type PropertyImagePayload = {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  altText?: string | null;
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
  propertyImages: Array<{
    fileUrl: string;
    isCover: boolean;
  }>;
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
    coverImageUrl:
      property.propertyImages.find((image) => image.isCover)?.fileUrl ??
      property.propertyImages[0]?.fileUrl ??
      null,
    contractCount: property._count.contracts,
    visitCount: property._count.visits,
    keyCount: property._count.propertyKeys,
  };
}

export class PropertiesService {
  private hasPermission(context: RequestContext, permission: string) {
    return context.permissions?.includes(permission) ?? false;
  }

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
          propertyImages: {
            orderBy: [{ isCover: "desc" }, { orderIndex: "asc" }],
            take: 3,
            select: {
              fileUrl: true,
              isCover: true,
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

  async getById(id: string, context: RequestContext = {}) {
    const canReadImages =
      this.hasPermission(context, permissionCodes.PROPERTY_IMAGES_READ) ||
      this.hasPermission(context, permissionCodes.PROPERTY_IMAGES_WRITE);
    const canReadKeys = this.hasPermission(context, permissionCodes.KEYS_READ);
    const canReadVisits = this.hasPermission(
      context,
      permissionCodes.VISITS_READ,
    );
    const canReadContracts = this.hasPermission(
      context,
      permissionCodes.CONTRACTS_READ,
    );
    const canReadMaintenance = this.hasPermission(
      context,
      permissionCodes.MAINTENANCE_READ,
    );
    const canReadTenants =
      this.hasPermission(context, permissionCodes.TENANTS_READ) ||
      canReadContracts;
    const activeContractStatuses = [
      ContractStatus.ACTIVE,
      ContractStatus.RENEWED,
    ];

    const [property, activeContract] = await Promise.all([
      prisma.property.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              personType: true,
              fullName: true,
              document: true,
              email: true,
              phone: true,
              secondaryPhone: true,
              city: true,
              state: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              contracts: true,
              visits: true,
              propertyKeys: true,
              saleLeads: true,
              rentLeads: true,
              maintenanceTickets: true,
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
          keyControls: {
            orderBy: { createdAt: "desc" },
            take: 8,
            select: {
              id: true,
              action: true,
              resultingStatus: true,
              holderName: true,
              createdAt: true,
              propertyKey: {
                select: {
                  identifier: true,
                },
              },
              responsibleUser: {
                select: {
                  fullName: true,
                },
              },
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
                  id: true,
                  fullName: true,
                  document: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
          maintenanceTickets: {
            orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
            take: 8,
            select: {
              id: true,
              ticketId: true,
              title: true,
              type: true,
              urgencyLevel: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              tenant: {
                select: {
                  fullName: true,
                },
              },
              assignedToUser: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          propertyImages: {
            orderBy: [{ isCover: "desc" }, { orderIndex: "asc" }],
          },
        },
      }),
      canReadTenants
        ? prisma.contract.findFirst({
            where: {
              propertyId: id,
              status: {
                in: activeContractStatuses,
              },
            },
            orderBy: { startDate: "desc" },
            select: {
              id: true,
              code: true,
              status: true,
              startDate: true,
              endDate: true,
              rentAmount: true,
              tenant: {
                select: {
                  id: true,
                  fullName: true,
                  document: true,
                  phone: true,
                  email: true,
                },
              },
            },
          })
        : Promise.resolve(null),
    ]);

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
      propertyImages: canReadImages ? property.propertyImages : [],
      propertyKeys: canReadKeys ? property.propertyKeys : [],
      keyControls: canReadKeys ? property.keyControls : [],
      visits: canReadVisits ? property.visits : [],
      contracts: canReadContracts
        ? property.contracts.map((contract) => ({
            ...contract,
            rentAmount: Number(contract.rentAmount),
          }))
        : [],
      maintenanceTickets: canReadMaintenance ? property.maintenanceTickets : [],
      activeContract: activeContract && canReadContracts
        ? {
            ...activeContract,
            rentAmount: Number(activeContract.rentAmount),
          }
        : null,
      activeTenant: canReadTenants ? activeContract?.tenant ?? null : null,
      metrics: {
        contractCount: property._count.contracts,
        visitCount: property._count.visits,
        keyCount: property._count.propertyKeys,
        saleLeadCount: property._count.saleLeads,
        rentLeadCount: property._count.rentLeads,
        maintenanceTicketCount: property._count.maintenanceTickets,
      },
    };
  }

  async addImages(
    propertyId: string,
    images: PropertyImagePayload[],
    context: RequestContext,
  ) {
    await this.ensurePropertyExists(propertyId);

    if (!images.length) {
      throw new HttpError(422, "Envie ao menos uma imagem válida.");
    }

    const existingImages = await prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: { orderIndex: "asc" },
      select: {
        id: true,
        isCover: true,
        orderIndex: true,
      },
    });

    const nextOrderIndex =
      existingImages.reduce(
        (highestOrder, image) => Math.max(highestOrder, image.orderIndex),
        -1,
      ) + 1;
    const hasCover = existingImages.some((image) => image.isCover);

    const createdImages = await prisma.$transaction(async (tx) => {
      const created = await Promise.all(
        images.map((image, index) =>
          tx.propertyImage.create({
            data: {
              propertyId,
              fileUrl: image.fileUrl,
              fileName: image.fileName,
              mimeType: image.mimeType,
              sizeBytes: image.sizeBytes,
              altText: normalizeOptionalString(image.altText),
              isCover: !hasCover && index === 0,
              orderIndex: nextOrderIndex + index,
              uploadedByUserId: context.actorUserId ?? null,
            },
          }),
        ),
      );

      await createAuditLog({
        actorUserId: context.actorUserId,
        action: "properties.images.upload",
        entityType: AuditEntityType.PROPERTY_IMAGE,
        entityId: propertyId,
        description: `Novas fotos foram adicionadas ao imóvel.`,
        metadata: {
          count: created.length,
          fileNames: created.map((item) => item.fileName),
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return created;
    });

    return createdImages;
  }

  async updateImage(
    propertyId: string,
    imageId: string,
    payload: { altText?: string | null; isCover?: boolean },
    context: RequestContext,
  ) {
    const existingImage = await prisma.propertyImage.findFirst({
      where: {
        id: imageId,
        propertyId,
      },
    });

    if (!existingImage) {
      throw new HttpError(404, "Imagem do imóvel não encontrada.");
    }

    const updatedImage = await prisma.$transaction(async (tx) => {
      if (payload.isCover) {
        await tx.propertyImage.updateMany({
          where: {
            propertyId,
            isCover: true,
            id: { not: imageId },
          },
          data: { isCover: false },
        });
      }

      return tx.propertyImage.update({
        where: { id: imageId },
        data: {
          altText:
            payload.altText === undefined
              ? existingImage.altText
              : normalizeOptionalString(payload.altText),
          isCover: payload.isCover ?? existingImage.isCover,
        },
      });
    });

    await createAuditLog({
      actorUserId: context.actorUserId,
      action: "properties.images.update",
      entityType: AuditEntityType.PROPERTY_IMAGE,
      entityId: imageId,
      description: "Metadados da imagem do imóvel foram atualizados.",
      metadata: payload,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return updatedImage;
  }

  async reorderImages(
    propertyId: string,
    imageIds: string[],
    context: RequestContext,
  ) {
    const images = await prisma.propertyImage.findMany({
      where: { propertyId },
      select: {
        id: true,
      },
    });

    if (images.length !== imageIds.length) {
      throw new HttpError(
        422,
        "A reordenação deve considerar todas as imagens do imóvel.",
      );
    }

    const imageIdSet = new Set(images.map((image) => image.id));
    const hasInvalidImage = imageIds.some((imageId) => !imageIdSet.has(imageId));

    if (hasInvalidImage) {
      throw new HttpError(422, "A lista de imagens contém itens inválidos.");
    }

    await prisma.$transaction(
      imageIds.map((imageId, index) =>
        prisma.propertyImage.update({
          where: { id: imageId },
          data: {
            orderIndex: index,
          },
        }),
      ),
    );

    await createAuditLog({
      actorUserId: context.actorUserId,
      action: "properties.images.reorder",
      entityType: AuditEntityType.PROPERTY_IMAGE,
      entityId: propertyId,
      description: "A ordem da galeria do imóvel foi atualizada.",
      metadata: { imageIds },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: [{ isCover: "desc" }, { orderIndex: "asc" }],
    });
  }

  async removeImage(propertyId: string, imageId: string, context: RequestContext) {
    const image = await prisma.propertyImage.findFirst({
      where: {
        id: imageId,
        propertyId,
      },
    });

    if (!image) {
      throw new HttpError(404, "Imagem do imóvel não encontrada.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.propertyImage.delete({
        where: { id: imageId },
      });

      if (image.isCover) {
        const nextImage = await tx.propertyImage.findFirst({
          where: { propertyId },
          orderBy: { orderIndex: "asc" },
        });

        if (nextImage) {
          await tx.propertyImage.update({
            where: { id: nextImage.id },
            data: {
              isCover: true,
            },
          });
        }
      }
    });

    await storageAdapter.deleteFile(image.fileUrl);

    await createAuditLog({
      actorUserId: context.actorUserId,
      action: "properties.images.remove",
      entityType: AuditEntityType.PROPERTY_IMAGE,
      entityId: imageId,
      description: "Uma foto foi removida da galeria do imóvel.",
      metadata: { propertyId, fileName: image.fileName },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      id: imageId,
      removed: true,
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
          propertyImages: {
            orderBy: [{ isCover: "desc" }, { orderIndex: "asc" }],
            take: 3,
            select: {
              fileUrl: true,
              isCover: true,
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
          propertyImages: {
            orderBy: [{ isCover: "desc" }, { orderIndex: "asc" }],
            take: 3,
            select: {
              fileUrl: true,
              isCover: true,
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

  private async ensurePropertyExists(propertyId: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });

    if (!property) {
      throw new HttpError(404, "Imóvel informado não foi encontrado.");
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
