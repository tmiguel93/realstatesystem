import {
  AuditEntityType,
  ContractStatus,
  MaintenanceTicketType,
  TenantMagicLinkStatus,
} from "@prisma/client";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { maintenanceTicketTypeOptions } from "@imobiliaria/shared";
import { env } from "../../config/env";
import { createAuditLog } from "../../core/audit";
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

type PublicTicketInput = {
  type: MaintenanceTicketType;
  description: string;
  complementaryNotes?: string | null;
  attachments: AttachmentInput[];
};

const ACTIVE_CONTRACT_STATUSES: ContractStatus[] = [
  ContractStatus.ACTIVE,
  ContractStatus.RENEWED,
];
const TOKEN_BYTES = 32;
const MAX_USER_AGENT_LENGTH = 255;
const DEFAULT_PUBLIC_PATH_PREFIX = "/portal/locatario/link";

const maintenanceService = new MaintenanceService();

function createToken() {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function encryptionKey() {
  return createHash("sha256").update(env.JWT_REFRESH_SECRET).digest();
}

function encryptToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptToken(ciphertext: string) {
  try {
    const [ivPart, authTagPart, encryptedPart] = ciphertext.split(".");

    if (!ivPart || !authTagPart || !encryptedPart) {
      return null;
    }

    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivPart, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function normalizeRequestContext(context: RequestContext) {
  return {
    ipAddress: context.ipAddress?.slice(0, 64),
    userAgent:
      typeof context.userAgent === "string"
        ? context.userAgent.slice(0, MAX_USER_AGENT_LENGTH)
        : undefined,
  };
}

function resolveTicketTypeLabel(type: MaintenanceTicketType) {
  return (
    maintenanceTicketTypeOptions.find((item) => item.value === type)?.label ??
    "Manutenção"
  );
}

function buildAddress(property: {
  street: string;
  streetNumber: string;
  district: string;
  city: string;
  state: string;
}) {
  return `${property.street}, ${property.streetNumber} - ${property.district}, ${property.city}/${property.state}`;
}

function buildPublicUrl(token: string) {
  return `${env.APP_ORIGIN}${DEFAULT_PUBLIC_PATH_PREFIX}/${token}`;
}

function mapMagicLink(link: {
  id: string;
  status: TenantMagicLinkStatus;
  tokenCiphertext: string;
  tokenPreview: string;
  expiresAt: Date;
  revokedAt: Date | null;
  lastAccessedAt: Date | null;
  lastAccessIpAddress: string | null;
  createdAt: Date;
  createdByUser: {
    id: string;
    fullName: string;
    email: string;
  };
}) {
  const token = decryptToken(link.tokenCiphertext);

  return {
    id: link.id,
    status: link.status,
    publicUrl: token ? buildPublicUrl(token) : null,
    tokenPreview: link.tokenPreview,
    expiresAt: link.expiresAt,
    revokedAt: link.revokedAt,
    lastAccessedAt: link.lastAccessedAt,
    lastAccessIpAddress: link.lastAccessIpAddress,
    createdAt: link.createdAt,
    createdByUser: link.createdByUser,
  };
}

export class TenantMagicLinkService {
  async getForContract(contractId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        code: true,
        status: true,
        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!contract) {
      throw new HttpError(404, "Contrato não encontrado.");
    }

    const link = await prisma.tenantMagicLink.findFirst({
      where: {
        contractId,
        status: TenantMagicLinkStatus.ACTIVE,
        revokedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      contract: {
        id: contract.id,
        code: contract.code,
        status: contract.status,
        tenant: contract.tenant,
      },
      link: link ? mapMagicLink(link) : null,
    };
  }

  async generateForContract(
    contractId: string,
    input: { expiresInDays: number },
    context: RequestContext,
  ) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessão inválida.");
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        code: true,
        status: true,
        tenantId: true,
        propertyId: true,
      },
    });

    if (!contract) {
      throw new HttpError(404, "Contrato não encontrado.");
    }

    if (!ACTIVE_CONTRACT_STATUSES.includes(contract.status)) {
      throw new HttpError(
        422,
        "O link seguro só pode ser gerado para contratos ativos ou renovados.",
      );
    }

    const token = createToken();
    const tokenHash = hashToken(token);
    const now = new Date();
    const expiresAt = addDays(now, input.expiresInDays);

    const link = await prisma.$transaction(async (tx) => {
      await tx.tenantMagicLink.updateMany({
        where: {
          contractId: contract.id,
          status: TenantMagicLinkStatus.ACTIVE,
          revokedAt: null,
        },
        data: {
          status: TenantMagicLinkStatus.REVOKED,
          revokedAt: now,
          revokedByUserId: context.actorUserId,
        },
      });

      return tx.tenantMagicLink.create({
        data: {
          contractId: contract.id,
          tenantId: contract.tenantId,
          tokenHash,
          tokenCiphertext: encryptToken(token),
          tokenPreview: `${token.slice(0, 8)}...${token.slice(-4)}`,
          status: TenantMagicLinkStatus.ACTIVE,
          expiresAt,
          createdByUserId: context.actorUserId!,
        },
        include: {
          createdByUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });
    });

    await this.audit("tenantMagicLink.generate", link.id, context, {
      contractId: contract.id,
      contractCode: contract.code,
      expiresAt,
    });

    return this.getForContract(contract.id);
  }

  async revokeForContract(contractId: string, context: RequestContext) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessão inválida.");
    }

    const link = await prisma.tenantMagicLink.findFirst({
      where: {
        contractId,
        status: TenantMagicLinkStatus.ACTIVE,
        revokedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        contract: {
          select: {
            code: true,
          },
        },
      },
    });

    if (!link) {
      throw new HttpError(404, "Nenhum link ativo foi encontrado para este contrato.");
    }

    const now = new Date();
    await prisma.tenantMagicLink.update({
      where: { id: link.id },
      data: {
        status: TenantMagicLinkStatus.REVOKED,
        revokedAt: now,
        revokedByUserId: context.actorUserId,
      },
    });

    await this.audit("tenantMagicLink.revoke", link.id, context, {
      contractId,
      contractCode: link.contract.code,
      revokedAt: now,
    });

    return {
      revoked: true,
      revokedAt: now,
    };
  }

  async getPublicOverview(token: string, context: RequestContext) {
    const link = await this.resolveValidLink(token, context);

    const [tickets, linkWithContract] = await Promise.all([
      prisma.maintenanceTicket.findMany({
        where: {
          tenantMagicLinkId: link.id,
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
      }),
      prisma.tenantMagicLink.findUniqueOrThrow({
        where: { id: link.id },
        include: {
          tenant: {
            select: {
              id: true,
              fullName: true,
              document: true,
              email: true,
            },
          },
          contract: {
            select: {
              id: true,
              code: true,
              status: true,
              startDate: true,
              endDate: true,
              rentAmount: true,
              dueDay: true,
              owner: {
                select: {
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
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
                  propertyImages: {
                    orderBy: [{ isCover: "desc" }, { orderIndex: "asc" }],
                    take: 1,
                    select: {
                      fileUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      link: {
        id: linkWithContract.id,
        status: linkWithContract.status,
        expiresAt: linkWithContract.expiresAt,
        lastAccessedAt: linkWithContract.lastAccessedAt,
      },
      tenant: linkWithContract.tenant,
      contract: {
        id: linkWithContract.contract.id,
        code: linkWithContract.contract.code,
        status: linkWithContract.contract.status,
        startDate: linkWithContract.contract.startDate,
        endDate: linkWithContract.contract.endDate,
        rentAmount: Number(linkWithContract.contract.rentAmount),
        dueDay: linkWithContract.contract.dueDay,
        owner: linkWithContract.contract.owner,
      },
      property: {
        id: linkWithContract.contract.property.id,
        code: linkWithContract.contract.property.code,
        title: linkWithContract.contract.property.title,
        addressSummary: buildAddress(linkWithContract.contract.property),
        coverImageUrl:
          linkWithContract.contract.property.propertyImages[0]?.fileUrl ?? null,
      },
      documents: [],
      recentTickets: tickets,
    };
  }

  async openMaintenanceTicket(
    token: string,
    payload: PublicTicketInput,
    context: RequestContext,
  ) {
    const link = await this.resolveValidLink(token, context);

    if (requiresVisualEvidence(payload.type) && payload.attachments.length === 0) {
      throw new HttpError(
        422,
        "Este tipo de chamado exige ao menos uma foto de evidência.",
      );
    }

    const ticket = await maintenanceService.createFromPortal(
      {
        propertyId: link.contract.propertyId,
        tenantId: link.tenantId,
        tenantMagicLinkId: link.id,
        title: `${resolveTicketTypeLabel(payload.type)} · ${link.contract.property.code}`,
        description: payload.description,
        type: payload.type,
        internalNotes: payload.complementaryNotes,
        attachments: payload.attachments,
      },
      {
        ...context,
        actorUserId: link.createdByUserId,
      },
    );

    if (!ticket) {
      throw new HttpError(500, "Não foi possível abrir o chamado pelo link seguro.");
    }

    await this.audit("tenantMagicLink.openMaintenanceTicket", link.id, context, {
      contractId: link.contractId,
      ticketId: ticket.ticketId,
    });

    return ticket;
  }

  private async resolveValidLink(token: string, context: RequestContext) {
    if (!token || token.length < 24) {
      throw new HttpError(401, "Link seguro inválido.");
    }

    const tokenHash = hashToken(token);
    const link = await prisma.tenantMagicLink.findUnique({
      where: { tokenHash },
      include: {
        contract: {
          select: {
            id: true,
            code: true,
            status: true,
            propertyId: true,
            tenantId: true,
            property: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    if (!link) {
      throw new HttpError(401, "Link seguro inválido.");
    }

    if (link.revokedAt || link.status === TenantMagicLinkStatus.REVOKED) {
      throw new HttpError(410, "Este link foi revogado pela imobiliária.");
    }

    const now = new Date();
    if (link.expiresAt < now || link.status === TenantMagicLinkStatus.EXPIRED) {
      if (link.status !== TenantMagicLinkStatus.EXPIRED) {
        await prisma.tenantMagicLink.update({
          where: { id: link.id },
          data: { status: TenantMagicLinkStatus.EXPIRED },
        });
      }

      throw new HttpError(410, "Este link seguro expirou.");
    }

    if (
      !ACTIVE_CONTRACT_STATUSES.includes(link.contract.status) ||
      link.contract.tenantId !== link.tenantId
    ) {
      throw new HttpError(
        403,
        "Este link não está mais vinculado a um contrato ativo.",
      );
    }

    const requestContext = normalizeRequestContext(context);
    await prisma.tenantMagicLink.update({
      where: { id: link.id },
      data: {
        lastAccessedAt: now,
        lastAccessIpAddress: requestContext.ipAddress,
        lastAccessUserAgent: requestContext.userAgent,
      },
    });

    return link;
  }

  private async audit(
    action: string,
    entityId: string,
    context: RequestContext,
    metadata?: unknown,
  ) {
    await createAuditLog({
      actorUserId: context.actorUserId ?? null,
      action,
      entityType: AuditEntityType.TENANT_MAGIC_LINK,
      entityId,
      description: "Evento de link seguro do locatário registrado.",
      metadata,
      ipAddress: context.ipAddress,
      userAgent:
        typeof context.userAgent === "string" ? context.userAgent : undefined,
    });
  }
}
