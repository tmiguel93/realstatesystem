import {
  AuditEntityType,
  HolderType,
  KeyAction,
  KeyStatus,
  Prisma,
} from "@prisma/client";
import { permissionCodes } from "@imobiliaria/shared";
import { prisma } from "../../core/prisma";
import { HttpError } from "../../core/http-error";
import { buildPaginationMeta, resolvePagination } from "../../core/pagination";
import { createAuditLog } from "../../core/audit";
import { rethrowPrismaError } from "../../core/prisma-error";

type KeysListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: KeyStatus;
  propertyId?: string;
  onlyOverdue?: boolean;
};

type RequestContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
  permissions?: string[];
};

type KeyPayload = {
  propertyId: string;
  identifier: string;
  description?: string | null;
  isCopy: boolean;
};

type KeyCheckoutPayload = {
  holderType: HolderType;
  holderName: string;
  holderDocument?: string | null;
  checkoutAt?: Date | null;
  expectedReturnAt?: Date | null;
  notes?: string | null;
  overrideReason?: string | null;
};

type KeyCheckinPayload = {
  returnedAt?: Date | null;
  notes?: string | null;
};

type KeyStatusPayload = {
  status: KeyStatus;
  notes?: string | null;
  overrideReason?: string | null;
};

function normalizeOptionalString(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function resolveBaseAvailableStatus(isCopy: boolean) {
  return isCopy ? KeyStatus.COPY : KeyStatus.AVAILABLE;
}

function isKeyAvailableForCheckout(status: KeyStatus) {
  return status === KeyStatus.AVAILABLE || status === KeyStatus.COPY;
}

function ensureCheckoutDatesAreCoherent(
  checkoutAt: Date,
  expectedReturnAt?: Date | null,
) {
  const toleranceMs = 5 * 60 * 1000;

  if (checkoutAt.getTime() > Date.now() + toleranceMs) {
    throw new HttpError(422, "A retirada nao pode ser registrada no futuro.");
  }

  if (expectedReturnAt && expectedReturnAt.getTime() <= checkoutAt.getTime()) {
    throw new HttpError(
      422,
      "A previsao de devolucao deve ser posterior a retirada.",
    );
  }
}

function mapKeyBase(key: {
  id: string;
  identifier: string;
  description: string | null;
  isCopy: boolean;
  currentStatus: KeyStatus;
  currentHolderType: HolderType | null;
  currentHolderName: string | null;
  currentHolderDocument: string | null;
  lastCheckoutAt: Date | null;
  lastCheckinAt: Date | null;
  createdAt: Date;
  property: {
    id: string;
    code: string;
    title: string;
    city: string;
    district: string;
    street: string;
    streetNumber: string;
  };
  controls: Array<{
    expectedReturnAt: Date | null;
    returnedAt: Date | null;
  }>;
}) {
  const currentControl = key.controls[0] ?? null;
  const expectedReturnAt = currentControl?.expectedReturnAt ?? null;
  const isOverdue =
    expectedReturnAt !== null &&
    key.currentStatus === KeyStatus.CHECKED_OUT &&
    currentControl?.returnedAt === null &&
    expectedReturnAt.getTime() < Date.now();

  return {
    id: key.id,
    identifier: key.identifier,
    description: key.description,
    isCopy: key.isCopy,
    currentStatus: key.currentStatus,
    currentHolderType: key.currentHolderType,
    currentHolderName: key.currentHolderName,
    currentHolderDocument: key.currentHolderDocument,
    lastCheckoutAt: key.lastCheckoutAt,
    lastCheckinAt: key.lastCheckinAt,
    createdAt: key.createdAt,
    expectedReturnAt,
    isOverdue,
    property: key.property,
  };
}

export class KeysService {
  async list(query: KeysListQuery) {
    const { page, pageSize, skip, take } = resolvePagination(query);
    const where: Prisma.PropertyKeyWhereInput = {
      ...(query.search
        ? {
            OR: [
              { identifier: { contains: query.search, mode: "insensitive" } },
              { currentHolderName: { contains: query.search, mode: "insensitive" } },
              { currentHolderDocument: { contains: query.search, mode: "insensitive" } },
              { property: { code: { contains: query.search, mode: "insensitive" } } },
              { property: { title: { contains: query.search, mode: "insensitive" } } },
              { property: { street: { contains: query.search, mode: "insensitive" } } },
              { property: { district: { contains: query.search, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(query.status ? { currentStatus: query.status } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.onlyOverdue
        ? {
            currentStatus: KeyStatus.CHECKED_OUT,
            controls: {
              some: {
                returnedAt: null,
                expectedReturnAt: {
                  lt: new Date(),
                },
              },
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.propertyKey.findMany({
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
              city: true,
              district: true,
              street: true,
              streetNumber: true,
            },
          },
          controls: {
            where: {
              returnedAt: null,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              expectedReturnAt: true,
              returnedAt: true,
            },
          },
        },
      }),
      prisma.propertyKey.count({ where }),
    ]);

    return {
      data: items.map(mapKeyBase),
      meta: buildPaginationMeta(total, page, pageSize),
    };
  }

  async getById(id: string) {
    const key = await prisma.propertyKey.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            code: true,
            title: true,
            city: true,
            district: true,
            street: true,
            streetNumber: true,
          },
        },
        controls: {
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            action: true,
            previousStatus: true,
            resultingStatus: true,
            holderType: true,
            holderName: true,
            holderDocument: true,
            checkoutAt: true,
            expectedReturnAt: true,
            returnedAt: true,
            notes: true,
            overrideReason: true,
            createdAt: true,
            responsibleUser: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!key) {
      throw new HttpError(404, "Chave nao encontrada.");
    }

    return {
      ...mapKeyBase({
        ...key,
        controls: key.controls.map((item) => ({
          expectedReturnAt: item.expectedReturnAt,
          returnedAt: item.returnedAt,
        })),
      }),
      history: key.controls,
    };
  }

  async create(payload: KeyPayload, context: RequestContext) {
    await this.ensurePropertyExists(payload.propertyId);

    try {
      const key = await prisma.propertyKey.create({
        data: {
          propertyId: payload.propertyId,
          identifier: payload.identifier.trim().toUpperCase(),
          description: normalizeOptionalString(payload.description),
          isCopy: payload.isCopy,
          currentStatus: resolveBaseAvailableStatus(payload.isCopy),
        },
        include: {
          property: {
            select: {
              id: true,
              code: true,
              title: true,
              city: true,
              district: true,
              street: true,
              streetNumber: true,
            },
          },
          controls: {
            where: {
              returnedAt: null,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              expectedReturnAt: true,
              returnedAt: true,
            },
          },
        },
      });

      await this.auditPropertyKey(
        "keys.create",
        key.id,
        `Chave ${key.identifier} cadastrada para o imovel ${key.property.code}.`,
        context,
        payload,
      );

      return mapKeyBase(key);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao cadastrar chave.");
    }
  }

  async checkout(id: string, payload: KeyCheckoutPayload, context: RequestContext) {
    const key = await this.getKeyForMutation(id);
    const checkoutAt = payload.checkoutAt ?? new Date();
    ensureCheckoutDatesAreCoherent(checkoutAt, payload.expectedReturnAt);
    const canOverride = context.permissions?.includes(permissionCodes.KEYS_OVERRIDE);
    const requiresOverride =
      key.currentStatus === KeyStatus.CHECKED_OUT ||
      !isKeyAvailableForCheckout(key.currentStatus);

    if (requiresOverride && (!canOverride || !normalizeOptionalString(payload.overrideReason))) {
      throw new HttpError(
        422,
        "Nova retirada exige permissao de override e justificativa valida.",
      );
    }

    try {
      const result = await prisma.$transaction(async (transaction) => {
        if (requiresOverride && key.currentStatus === KeyStatus.CHECKED_OUT) {
          await transaction.keyControl.updateMany({
            where: {
              propertyKeyId: id,
              resultingStatus: KeyStatus.CHECKED_OUT,
              returnedAt: null,
            },
            data: {
              returnedAt: checkoutAt,
            },
          });
        }

        const updatedKey = await transaction.propertyKey.update({
          where: { id },
          data: {
            currentStatus: KeyStatus.CHECKED_OUT,
            currentHolderType: payload.holderType,
            currentHolderName: payload.holderName.trim(),
            currentHolderDocument: normalizeOptionalString(payload.holderDocument),
            lastCheckoutAt: checkoutAt,
          },
          include: {
            property: {
              select: {
                id: true,
                code: true,
                title: true,
                city: true,
                district: true,
                street: true,
                streetNumber: true,
              },
            },
            controls: {
              where: {
                returnedAt: null,
              },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                expectedReturnAt: true,
                returnedAt: true,
              },
            },
          },
        });

        await transaction.keyControl.create({
          data: {
            propertyKeyId: id,
            propertyId: key.propertyId,
            responsibleUserId: context.actorUserId ?? null,
            action: requiresOverride ? KeyAction.OVERRIDE : KeyAction.CHECKOUT,
            previousStatus: key.currentStatus,
            resultingStatus: KeyStatus.CHECKED_OUT,
            holderType: payload.holderType,
            holderName: payload.holderName.trim(),
            holderDocument: normalizeOptionalString(payload.holderDocument),
            checkoutAt,
            expectedReturnAt: payload.expectedReturnAt ?? null,
            notes: normalizeOptionalString(payload.notes),
            overrideReason: normalizeOptionalString(payload.overrideReason),
          },
        });

        return updatedKey;
      });

      await this.auditKeyControl(
        "keys.checkout",
        id,
        "Retirada de chave registrada.",
        context,
        payload,
      );

      return mapKeyBase(result);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao registrar retirada da chave.");
    }
  }

  async checkin(id: string, payload: KeyCheckinPayload, context: RequestContext) {
    const key = await this.getKeyForMutation(id);
    const returnedAt = payload.returnedAt ?? new Date();

    if (key.currentStatus !== KeyStatus.CHECKED_OUT) {
      throw new HttpError(
        422,
        "Nao ha retirada em aberto para registrar devolucao.",
      );
    }

    if (key.lastCheckoutAt && returnedAt.getTime() < key.lastCheckoutAt.getTime()) {
      throw new HttpError(
        422,
        "A devolucao nao pode ser anterior a retirada registrada.",
      );
    }

    const openCheckout = await prisma.keyControl.findFirst({
      where: {
        propertyKeyId: id,
        resultingStatus: KeyStatus.CHECKED_OUT,
        returnedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
      },
    });

    if (!openCheckout) {
      throw new HttpError(
        422,
        "Nao foi encontrada retirada pendente para esta chave.",
      );
    }

    try {
      const result = await prisma.$transaction(async (transaction) => {
        await transaction.keyControl.update({
          where: { id: openCheckout.id },
          data: {
            returnedAt,
          },
        });

        const updatedKey = await transaction.propertyKey.update({
          where: { id },
          data: {
            currentStatus: resolveBaseAvailableStatus(key.isCopy),
            currentHolderType: null,
            currentHolderName: null,
            currentHolderDocument: null,
            lastCheckinAt: returnedAt,
          },
          include: {
            property: {
              select: {
                id: true,
                code: true,
                title: true,
                city: true,
                district: true,
                street: true,
                streetNumber: true,
              },
            },
            controls: {
              where: {
                returnedAt: null,
              },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                expectedReturnAt: true,
                returnedAt: true,
              },
            },
          },
        });

        await transaction.keyControl.create({
          data: {
            propertyKeyId: id,
            propertyId: key.propertyId,
            responsibleUserId: context.actorUserId ?? null,
            action: KeyAction.CHECKIN,
            previousStatus: KeyStatus.CHECKED_OUT,
            resultingStatus: resolveBaseAvailableStatus(key.isCopy),
            returnedAt,
            notes: normalizeOptionalString(payload.notes),
          },
        });

        return updatedKey;
      });

      await this.auditKeyControl(
        "keys.checkin",
        id,
        "Devolucao de chave registrada.",
        context,
        payload,
      );

      return mapKeyBase(result);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao registrar devolucao da chave.");
    }
  }

  async changeStatus(id: string, payload: KeyStatusPayload, context: RequestContext) {
    const key = await this.getKeyForMutation(id);
    const canOverride = context.permissions?.includes(permissionCodes.KEYS_OVERRIDE);
    const normalizedOverrideReason = normalizeOptionalString(payload.overrideReason);

    if (payload.status === KeyStatus.CHECKED_OUT) {
      throw new HttpError(
        422,
        "Use a operacao de retirada para registrar chave em posse de alguem.",
      );
    }

    if (
      key.currentStatus === KeyStatus.CHECKED_OUT &&
      payload.status !== resolveBaseAvailableStatus(key.isCopy) &&
      (!canOverride || !normalizedOverrideReason)
    ) {
      throw new HttpError(
        422,
        "Alteracao sensivel de chave retirada exige override autorizado.",
      );
    }

    const resultingStatus =
      payload.status === KeyStatus.AVAILABLE
        ? resolveBaseAvailableStatus(key.isCopy)
        : payload.status;

    const action =
      resultingStatus === KeyStatus.UNDER_MAINTENANCE
        ? KeyAction.MAINTENANCE_START
        : key.currentStatus === KeyStatus.UNDER_MAINTENANCE
          ? KeyAction.MAINTENANCE_END
          : normalizedOverrideReason
            ? KeyAction.OVERRIDE
            : KeyAction.STATUS_CHANGE;

    try {
      const result = await prisma.$transaction(async (transaction) => {
        if (key.currentStatus === KeyStatus.CHECKED_OUT) {
          await transaction.keyControl.updateMany({
            where: {
              propertyKeyId: id,
              resultingStatus: KeyStatus.CHECKED_OUT,
              returnedAt: null,
            },
            data: {
              returnedAt: new Date(),
            },
          });
        }

        const updatedKey = await transaction.propertyKey.update({
          where: { id },
          data: {
            currentStatus: resultingStatus,
            currentHolderType: null,
            currentHolderName: null,
            currentHolderDocument: null,
          },
          include: {
            property: {
              select: {
                id: true,
                code: true,
                title: true,
                city: true,
                district: true,
                street: true,
                streetNumber: true,
              },
            },
            controls: {
              where: {
                returnedAt: null,
              },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                expectedReturnAt: true,
                returnedAt: true,
              },
            },
          },
        });

        await transaction.keyControl.create({
          data: {
            propertyKeyId: id,
            propertyId: key.propertyId,
            responsibleUserId: context.actorUserId ?? null,
            action,
            previousStatus: key.currentStatus,
            resultingStatus,
            notes: normalizeOptionalString(payload.notes),
            overrideReason: normalizedOverrideReason,
          },
        });

        return updatedKey;
      });

      await this.auditKeyControl(
        "keys.change-status",
        id,
        "Status de chave alterado.",
        context,
        payload,
      );

      return mapKeyBase(result);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao alterar status da chave.");
    }
  }

  private async ensurePropertyExists(propertyId: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });

    if (!property) {
      throw new HttpError(404, "Imovel vinculado nao encontrado.");
    }
  }

  private async getKeyForMutation(id: string) {
    const key = await prisma.propertyKey.findUnique({
      where: { id },
      select: {
        id: true,
        propertyId: true,
        identifier: true,
        isCopy: true,
        currentStatus: true,
        currentHolderType: true,
        currentHolderName: true,
        currentHolderDocument: true,
        lastCheckoutAt: true,
      },
    });

    if (!key) {
      throw new HttpError(404, "Chave nao encontrada.");
    }

    return key;
  }

  private async auditPropertyKey(
    action: string,
    entityId: string,
    description: string,
    context: RequestContext,
    metadata: unknown,
  ) {
    await createAuditLog({
      actorUserId: context.actorUserId,
      action,
      entityType: AuditEntityType.PROPERTY_KEY,
      entityId,
      description,
      metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  private async auditKeyControl(
    action: string,
    entityId: string,
    description: string,
    context: RequestContext,
    metadata: unknown,
  ) {
    await createAuditLog({
      actorUserId: context.actorUserId,
      action,
      entityType: AuditEntityType.KEY_CONTROL,
      entityId,
      description,
      metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}
