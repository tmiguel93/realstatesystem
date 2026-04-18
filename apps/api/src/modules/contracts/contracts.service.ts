import { randomUUID } from "node:crypto";
import {
  AuditEntityType,
  ContractOriginType,
  ContractStatus,
  ContractVersionStatus,
  LeadStatus,
  Prisma,
  PropertyPurpose,
  PropertyStatus,
  RentLeadStage,
} from "@prisma/client";
import { prisma } from "../../core/prisma";
import { HttpError } from "../../core/http-error";
import { buildPaginationMeta, resolvePagination } from "../../core/pagination";
import { createAuditLog } from "../../core/audit";
import { rethrowPrismaError } from "../../core/prisma-error";
import {
  CONTRACT_TEMPLATE_NAME,
  CONTRACT_TEMPLATE_VERSION,
  DEFAULT_CONTRACT_LEGAL_WARNING,
  renderContractTemplate,
  type ContractTemplateInput,
} from "./contracts.template";
import { generateContractPdfBuffer } from "./contracts.pdf";
import type {
  ContractPayloadInput,
  ContractReviewPayloadInput,
  ContractStatusPayloadInput,
} from "./contracts.schemas";

const ONGOING_CONTRACT_STATUSES = [
  ContractStatus.DRAFT,
  ContractStatus.UNDER_REVIEW,
  ContractStatus.PENDING_SIGNATURE,
  ContractStatus.ACTIVE,
] as const;

const DEFAULT_RESPONSIBILITIES = [
  "Pagar aluguel e encargos convencionados nos prazos ajustados.",
  "Utilizar o imovel exclusivamente para destinacao residencial, salvo ajuste escrito em contrario.",
  "Comunicar ocorrencias relevantes e necessidades de reparo sem atraso indevido.",
  "Zelar pela conservacao do imovel e devolve-lo conforme as condicoes pactuadas e a vistoria.",
] as const;

const contractListInclude = Prisma.validator<Prisma.ContractDefaultArgs>()({
  include: {
    property: {
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        commercialSituation: true,
        purpose: true,
      },
    },
    owner: {
      select: {
        id: true,
        fullName: true,
        document: true,
      },
    },
    tenant: {
      select: {
        id: true,
        fullName: true,
        document: true,
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
    versions: {
      orderBy: { versionNumber: "desc" },
      take: 1,
      select: {
        id: true,
        versionNumber: true,
        status: true,
        templateName: true,
        templateVersion: true,
        pdfFileUrl: true,
        reviewedAt: true,
        createdAt: true,
        reviewedByUser: {
          select: {
            fullName: true,
          },
        },
      },
    },
    _count: {
      select: {
        versions: true,
      },
    },
  },
});

const contractDetailInclude = Prisma.validator<Prisma.ContractDefaultArgs>()({
  include: {
    property: {
      select: {
        id: true,
        code: true,
        title: true,
        type: true,
        purpose: true,
        status: true,
        commercialSituation: true,
        zipCode: true,
        state: true,
        city: true,
        district: true,
        street: true,
        streetNumber: true,
        complement: true,
      },
    },
    owner: {
      select: {
        id: true,
        fullName: true,
        document: true,
        email: true,
        phone: true,
      },
    },
    tenant: {
      select: {
        id: true,
        fullName: true,
        document: true,
        email: true,
        phone: true,
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
    createdByUser: {
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    },
    versions: {
      orderBy: { versionNumber: "desc" },
      select: {
        id: true,
        versionNumber: true,
        status: true,
        templateName: true,
        templateVersion: true,
        renderedHtml: true,
        renderedText: true,
        dataSnapshot: true,
        pdfFileUrl: true,
        reviewedAt: true,
        createdAt: true,
        reviewedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    },
    _count: {
      select: {
        versions: true,
      },
    },
  },
});

type ContractListRecord = Prisma.ContractGetPayload<typeof contractListInclude>;
type ContractDetailRecord = Prisma.ContractGetPayload<typeof contractDetailInclude>;

type ContractListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ContractStatus;
  propertyId?: string;
  ownerId?: string;
  tenantId?: string;
  rentLeadId?: string;
  onlyExpiring?: boolean;
};

type RequestContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

type ContractSourceSnapshot = {
  originType: ContractOriginType;
  rentLead: {
    id: string;
    code: string;
    customerName: string;
    pipelineStage: RentLeadStage;
    status: LeadStatus;
  } | null;
  property: {
    id: string;
    code: string;
    title: string;
    type: string;
    purpose: PropertyPurpose;
    status: PropertyStatus;
    city: string;
    district: string;
    street: string;
    streetNumber: string;
    complement: string | null;
    zipCode: string;
    state: string;
  };
  owner: {
    id: string;
    fullName: string;
    document: string;
    email: string | null;
    phone: string | null;
  };
  tenant: {
    id: string;
    fullName: string;
    document: string;
    email: string | null;
    phone: string | null;
  };
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

function daysUntil(date: Date) {
  const diffInMs = date.getTime() - Date.now();
  return Math.ceil(diffInMs / 86_400_000);
}

function resolveResponsibilities(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) {
    return [...DEFAULT_RESPONSIBILITIES];
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!normalized.length) {
    return [...DEFAULT_RESPONSIBILITIES];
  }

  return [...new Set(normalized)];
}

function normalizeResponsibilities(value: string[]) {
  const normalized = value
    .map((item) => item.trim())
    .filter(Boolean);

  if (!normalized.length) {
    return [...DEFAULT_RESPONSIBILITIES];
  }

  return [...new Set(normalized)];
}

function mapContractListItem(contract: ContractListRecord) {
  const latestVersion = contract.versions[0] ?? null;
  const daysToEnd = daysUntil(contract.endDate);
  const isExpiringSoon =
    contract.status === ContractStatus.ACTIVE && daysToEnd >= 0 && daysToEnd <= 45;

  return {
    id: contract.id,
    code: contract.code,
    originType: contract.originType,
    status: contract.status,
    startDate: contract.startDate,
    endDate: contract.endDate,
    rentAmount: Number(contract.rentAmount),
    dueDay: contract.dueDay,
    guaranteeType: contract.guaranteeType,
    adjustmentIndex: contract.adjustmentIndex,
    createdAt: contract.createdAt,
    activatedAt: contract.activatedAt,
    terminatedAt: contract.terminatedAt,
    property: contract.property,
    owner: contract.owner,
    tenant: contract.tenant,
    rentLead: contract.rentLead,
    latestVersion: latestVersion
      ? {
          id: latestVersion.id,
          versionNumber: latestVersion.versionNumber,
          status: latestVersion.status,
          templateName: latestVersion.templateName,
          templateVersion: latestVersion.templateVersion,
          pdfFileUrl: latestVersion.pdfFileUrl,
          reviewedAt: latestVersion.reviewedAt,
          createdAt: latestVersion.createdAt,
          reviewedByUser: latestVersion.reviewedByUser,
        }
      : null,
    versionCount: contract._count.versions,
    daysToEnd,
    isExpiringSoon,
  };
}

function mapContractDetail(contract: ContractDetailRecord) {
  const latestVersion = contract.versions[0] ?? null;

  return {
    id: contract.id,
    code: contract.code,
    originType: contract.originType,
    status: contract.status,
    startDate: contract.startDate,
    endDate: contract.endDate,
    rentAmount: Number(contract.rentAmount),
    dueDay: contract.dueDay,
    guaranteeType: contract.guaranteeType,
    guaranteeDetails: contract.guaranteeDetails,
    adjustmentIndex: contract.adjustmentIndex,
    adjustmentFrequencyMonths: contract.adjustmentFrequencyMonths,
    lateFeePercentage: toNumber(contract.lateFeePercentage),
    penaltyDescription: contract.penaltyDescription,
    responsibilities: resolveResponsibilities(contract.responsibilities),
    additionalClauses: contract.additionalClauses,
    legalWarningAcknowledgedAt: contract.legalWarningAcknowledgedAt,
    activatedAt: contract.activatedAt,
    terminatedAt: contract.terminatedAt,
    terminationReason: contract.terminationReason,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    property: contract.property,
    owner: contract.owner,
    tenant: contract.tenant,
    rentLead: contract.rentLead,
    createdByUser: contract.createdByUser,
    versions: contract.versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      status: version.status,
      templateName: version.templateName,
      templateVersion: version.templateVersion,
      renderedHtml: version.renderedHtml,
      renderedText: version.renderedText,
      dataSnapshot: version.dataSnapshot,
      pdfFileUrl: version.pdfFileUrl,
      reviewedAt: version.reviewedAt,
      createdAt: version.createdAt,
      reviewedByUser: version.reviewedByUser,
      createdByUser: version.createdByUser,
    })),
    metrics: {
      versionCount: contract._count.versions,
      daysToEnd: daysUntil(contract.endDate),
      latestVersionId: latestVersion?.id ?? null,
    },
  };
}

export class ContractsService {
  async list(query: ContractListQuery) {
    const { page, pageSize, skip, take } = resolvePagination(query);
    const expiringLimit = new Date();
    expiringLimit.setDate(expiringLimit.getDate() + 45);

    const where: Prisma.ContractWhereInput = {
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: "insensitive" } },
              { property: { code: { contains: query.search, mode: "insensitive" } } },
              { property: { title: { contains: query.search, mode: "insensitive" } } },
              { owner: { fullName: { contains: query.search, mode: "insensitive" } } },
              { tenant: { fullName: { contains: query.search, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.tenantId ? { tenantId: query.tenantId } : {}),
      ...(query.rentLeadId ? { rentLeadId: query.rentLeadId } : {}),
      ...(query.onlyExpiring
        ? {
            status: ContractStatus.ACTIVE,
            endDate: {
              lte: expiringLimit,
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        ...contractListInclude,
      }),
      prisma.contract.count({ where }),
    ]);

    return {
      data: items.map(mapContractListItem),
      meta: buildPaginationMeta(total, page, pageSize),
    };
  }

  async getById(id: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      ...contractDetailInclude,
    });

    if (!contract) {
      throw new HttpError(404, "Contrato nao encontrado.");
    }

    return mapContractDetail(contract);
  }

  async create(payload: ContractPayloadInput, context: RequestContext) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessao invalida para gerar contrato.");
    }

    const snapshot = await this.resolveSourceSnapshot(payload);
    await this.ensureNoOngoingConflict(snapshot.property.id, snapshot.rentLead?.id ?? null);

    const responsibilities = normalizeResponsibilities(payload.responsibilities);
    const contractId = randomUUID();
    const versionId = randomUUID();
    const code = this.buildCode(payload.code);
    const rendered = renderContractTemplate(
      this.buildTemplateInput(payload, snapshot, code, responsibilities),
    );

    try {
      const contract = await prisma.$transaction(async (tx) => {
        await tx.contract.create({
          data: {
            id: contractId,
            code,
            originType: snapshot.originType,
            status: ContractStatus.DRAFT,
            rentLeadId: snapshot.rentLead?.id ?? null,
            propertyId: snapshot.property.id,
            ownerId: snapshot.owner.id,
            tenantId: snapshot.tenant.id,
            createdByUserId: context.actorUserId!,
            startDate: payload.startDate,
            endDate: payload.endDate,
            rentAmount: payload.rentAmount,
            dueDay: payload.dueDay,
            guaranteeType: payload.guaranteeType,
            guaranteeDetails: normalizeOptionalString(payload.guaranteeDetails),
            adjustmentIndex: payload.adjustmentIndex,
            adjustmentFrequencyMonths: payload.adjustmentFrequencyMonths,
            lateFeePercentage: payload.lateFeePercentage ?? null,
            penaltyDescription: normalizeOptionalString(payload.penaltyDescription),
            responsibilities,
            additionalClauses: normalizeOptionalString(payload.additionalClauses),
            legalWarningAcknowledgedAt: new Date(),
          },
        });

        await tx.contractVersion.create({
          data: {
            id: versionId,
            contractId,
            versionNumber: 1,
            status: ContractVersionStatus.DRAFT,
            templateName: CONTRACT_TEMPLATE_NAME,
            templateVersion: CONTRACT_TEMPLATE_VERSION,
            renderedHtml: rendered.renderedHtml,
            renderedText: rendered.renderedText,
            dataSnapshot: rendered.dataSnapshot,
            pdfFileUrl: this.buildPdfUrl(contractId, versionId),
            createdByUserId: context.actorUserId!,
          },
        });

        if (snapshot.rentLead) {
          await this.syncRentLeadStage(tx, snapshot.rentLead.id, "generated");
        }

        return tx.contract.findUniqueOrThrow({
          where: { id: contractId },
          ...contractDetailInclude,
        });
      });

      await this.audit(
        "contracts.create",
        contractId,
        code,
        AuditEntityType.CONTRACT,
        context,
        {
          originType: payload.originType,
          rentLeadId: snapshot.rentLead?.id ?? null,
          propertyId: snapshot.property.id,
          tenantId: snapshot.tenant.id,
        },
      );
      await this.audit(
        "contracts.version.create",
        versionId,
        `${code}-v1`,
        AuditEntityType.CONTRACT_VERSION,
        context,
        {
          contractId,
          versionNumber: 1,
        },
      );

      return mapContractDetail(contract);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao gerar contrato de locacao.");
    }
  }

  async createVersion(
    contractId: string,
    payload: ContractPayloadInput,
    context: RequestContext,
  ) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessao invalida para versionar contrato.");
    }

    const existingContract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        code: true,
        originType: true,
        status: true,
        rentLeadId: true,
      },
    });

    if (!existingContract) {
      throw new HttpError(404, "Contrato nao encontrado.");
    }

    const blockedVersionStatuses: ContractStatus[] = [
      ContractStatus.ACTIVE,
      ContractStatus.TERMINATED,
      ContractStatus.CANCELLED,
      ContractStatus.EXPIRED,
      ContractStatus.RENEWED,
    ];

    if (blockedVersionStatuses.includes(existingContract.status)) {
      throw new HttpError(
        409,
        "Versao adicional nao pode ser criada para contrato ativo ou encerrado.",
      );
    }

    if (payload.originType !== existingContract.originType) {
      throw new HttpError(
        422,
        "A origem do contrato nao pode ser alterada durante o versionamento.",
      );
    }

    const snapshot = await this.resolveSourceSnapshot(payload, {
      fallbackRentLeadId: existingContract.rentLeadId,
    });
    await this.ensureNoOngoingConflict(
      snapshot.property.id,
      snapshot.rentLead?.id ?? null,
      existingContract.id,
    );

    const responsibilities = normalizeResponsibilities(payload.responsibilities);

    try {
      const contract = await prisma.$transaction(async (tx) => {
        const latestVersion = await tx.contractVersion.findFirst({
          where: { contractId },
          orderBy: { versionNumber: "desc" },
          select: {
            versionNumber: true,
          },
        });

        const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;
        const versionId = randomUUID();
        const nextCode = this.buildCode(payload.code ?? existingContract.code);
        const rendered = renderContractTemplate(
          this.buildTemplateInput(payload, snapshot, nextCode, responsibilities),
        );

        await tx.contract.update({
          where: { id: contractId },
          data: {
            code: nextCode,
            status: ContractStatus.DRAFT,
            rentLeadId: snapshot.rentLead?.id ?? null,
            propertyId: snapshot.property.id,
            ownerId: snapshot.owner.id,
            tenantId: snapshot.tenant.id,
            startDate: payload.startDate,
            endDate: payload.endDate,
            rentAmount: payload.rentAmount,
            dueDay: payload.dueDay,
            guaranteeType: payload.guaranteeType,
            guaranteeDetails: normalizeOptionalString(payload.guaranteeDetails),
            adjustmentIndex: payload.adjustmentIndex,
            adjustmentFrequencyMonths: payload.adjustmentFrequencyMonths,
            lateFeePercentage: payload.lateFeePercentage ?? null,
            penaltyDescription: normalizeOptionalString(payload.penaltyDescription),
            responsibilities,
            additionalClauses: normalizeOptionalString(payload.additionalClauses),
            legalWarningAcknowledgedAt: new Date(),
            terminationReason: null,
          },
        });

        await tx.contractVersion.create({
          data: {
            id: versionId,
            contractId,
            versionNumber: nextVersionNumber,
            status: ContractVersionStatus.DRAFT,
            templateName: CONTRACT_TEMPLATE_NAME,
            templateVersion: CONTRACT_TEMPLATE_VERSION,
            renderedHtml: rendered.renderedHtml,
            renderedText: rendered.renderedText,
            dataSnapshot: rendered.dataSnapshot,
            pdfFileUrl: this.buildPdfUrl(contractId, versionId),
            createdByUserId: context.actorUserId!,
          },
        });

        if (snapshot.rentLead) {
          await this.syncRentLeadStage(tx, snapshot.rentLead.id, "generated");
        }

        return tx.contract.findUniqueOrThrow({
          where: { id: contractId },
          ...contractDetailInclude,
        });
      });

      const latestVersion = contract.versions[0];

      await this.audit(
        "contracts.update",
        contractId,
        contract.code,
        AuditEntityType.CONTRACT,
        context,
        {
          versioning: true,
          rentLeadId: snapshot.rentLead?.id ?? null,
          propertyId: snapshot.property.id,
          tenantId: snapshot.tenant.id,
        },
      );
      if (latestVersion) {
        await this.audit(
          "contracts.version.create",
          latestVersion.id,
          `${contract.code}-v${latestVersion.versionNumber}`,
          AuditEntityType.CONTRACT_VERSION,
          context,
          {
            contractId,
            versionNumber: latestVersion.versionNumber,
          },
        );
      }

      return mapContractDetail(contract);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao gerar nova versao do contrato.");
    }
  }

  async reviewVersion(
    contractId: string,
    versionId: string,
    payload: ContractReviewPayloadInput,
    context: RequestContext,
  ) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessao invalida para revisar contrato.");
    }

    const existingVersion = await prisma.contractVersion.findUnique({
      where: { id: versionId },
      select: {
        id: true,
        contractId: true,
        versionNumber: true,
        status: true,
        contract: {
          select: {
            id: true,
            code: true,
            rentLeadId: true,
          },
        },
      },
    });

    if (!existingVersion || existingVersion.contractId !== contractId) {
      throw new HttpError(404, "Versao do contrato nao encontrada.");
    }

    if (existingVersion.status === ContractVersionStatus.CANCELLED) {
      throw new HttpError(409, "Versao cancelada nao pode ser revisada.");
    }

    const nextContractStatus =
      payload.status === ContractVersionStatus.FINALIZED
        ? ContractStatus.PENDING_SIGNATURE
        : ContractStatus.UNDER_REVIEW;

    try {
      const contract = await prisma.$transaction(async (tx) => {
        await tx.contractVersion.update({
          where: { id: versionId },
          data: {
            status: payload.status,
            reviewedAt: new Date(),
            reviewedByUserId: context.actorUserId!,
          },
        });

        await tx.contract.update({
          where: { id: contractId },
          data: {
            status: nextContractStatus,
          },
        });

        if (existingVersion.contract.rentLeadId) {
          await this.syncRentLeadStage(
            tx,
            existingVersion.contract.rentLeadId,
            payload.status === ContractVersionStatus.FINALIZED
              ? "signature-pending"
              : "generated",
          );
        }

        return tx.contract.findUniqueOrThrow({
          where: { id: contractId },
          ...contractDetailInclude,
        });
      });

      await this.audit(
        "contracts.version.review",
        versionId,
        `${existingVersion.contract.code}-v${existingVersion.versionNumber}`,
        AuditEntityType.CONTRACT_VERSION,
        context,
        {
          contractId,
          status: payload.status,
        },
      );

      return mapContractDetail(contract);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao revisar versao do contrato.");
    }
  }

  async updateStatus(
    contractId: string,
    payload: ContractStatusPayloadInput,
    context: RequestContext,
  ) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessao invalida para atualizar contrato.");
    }

    const existingContract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        code: true,
        status: true,
        propertyId: true,
        rentLeadId: true,
        activatedAt: true,
        property: {
          select: {
            purpose: true,
          },
        },
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!existingContract) {
      throw new HttpError(404, "Contrato nao encontrado.");
    }

    const latestVersion = existingContract.versions[0];

    if (!latestVersion) {
      throw new HttpError(
        409,
        "Contrato sem versao vinculada nao pode ter status alterado.",
      );
    }

    if (payload.status === ContractStatus.ACTIVE) {
      if (existingContract.status !== ContractStatus.PENDING_SIGNATURE) {
        throw new HttpError(
          409,
          "Somente contratos com assinatura pendente podem ser ativados.",
        );
      }

      if (latestVersion.status !== ContractVersionStatus.FINALIZED) {
        throw new HttpError(
          409,
          "Somente a ultima versao finalizada pode ativar o contrato.",
        );
      }
    }

    if (
      payload.status === ContractStatus.RENEWED &&
      existingContract.status !== ContractStatus.ACTIVE
    ) {
      throw new HttpError(
        409,
        "Somente contratos ativos podem ser marcados como renovados.",
      );
    }

    const terminableStatuses: ContractStatus[] = [
      ContractStatus.ACTIVE,
      ContractStatus.PENDING_SIGNATURE,
    ];

    if (
      payload.status === ContractStatus.TERMINATED &&
      !terminableStatuses.includes(existingContract.status)
    ) {
      throw new HttpError(
        409,
        "Encerramento manual exige contrato ativo ou em assinatura.",
      );
    }

    try {
      const contract = await prisma.$transaction(async (tx) => {
        await tx.contract.update({
          where: { id: contractId },
          data: {
            status: payload.status,
            activatedAt:
              payload.status === ContractStatus.ACTIVE
                ? existingContract.activatedAt ?? new Date()
                : existingContract.activatedAt,
            terminatedAt:
              payload.status === ContractStatus.ACTIVE ? null : new Date(),
            terminationReason:
              payload.status === ContractStatus.ACTIVE
                ? null
                : normalizeOptionalString(payload.terminationReason),
          },
        });

        if (payload.status === ContractStatus.ACTIVE) {
          await tx.property.update({
            where: { id: existingContract.propertyId },
            data: {
              status: PropertyStatus.RENTED,
              commercialSituation: "RENTED",
            },
          });

          if (existingContract.rentLeadId) {
            await this.syncRentLeadStage(tx, existingContract.rentLeadId, "active");
          }
        }

        const releasingStatuses: ContractStatus[] = [
          ContractStatus.CANCELLED,
          ContractStatus.TERMINATED,
          ContractStatus.EXPIRED,
        ];

        if (releasingStatuses.includes(payload.status)) {
          await this.reopenPropertyIfAvailable(
            tx,
            existingContract.propertyId,
            existingContract.id,
            existingContract.property.purpose,
          );
        }

        return tx.contract.findUniqueOrThrow({
          where: { id: contractId },
          ...contractDetailInclude,
        });
      });

      await this.audit(
        "contracts.status.update",
        contractId,
        existingContract.code,
        AuditEntityType.CONTRACT,
        context,
        {
          previousStatus: existingContract.status,
          nextStatus: payload.status,
          terminationReason: payload.terminationReason ?? null,
        },
      );

      return mapContractDetail(contract);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao atualizar status do contrato.");
    }
  }

  async generatePdf(contractId: string, versionId: string) {
    const version = await prisma.contractVersion.findUnique({
      where: { id: versionId },
      select: {
        id: true,
        contractId: true,
        versionNumber: true,
        renderedText: true,
        dataSnapshot: true,
        contract: {
          select: {
            code: true,
          },
        },
      },
    });

    if (!version || version.contractId !== contractId) {
      throw new HttpError(404, "Versao do contrato nao encontrada.");
    }

    const snapshot =
      version.dataSnapshot && typeof version.dataSnapshot === "object"
        ? version.dataSnapshot
        : null;
    const legalWarningText =
      snapshot &&
      "legalWarningText" in snapshot &&
      typeof snapshot.legalWarningText === "string"
        ? snapshot.legalWarningText
        : DEFAULT_CONTRACT_LEGAL_WARNING;

    const buffer = await generateContractPdfBuffer({
      title: `${version.contract.code} - versao ${version.versionNumber}`,
      subtitle: "Minuta de locacao residencial parametrizada",
      renderedText:
        version.renderedText ??
        "Versao sem texto renderizado disponivel para exportacao.",
      legalWarningText,
    });

    return {
      buffer,
      fileName: `${version.contract.code.toLowerCase()}-v${version.versionNumber}.pdf`,
    };
  }

  private async resolveSourceSnapshot(
    payload: ContractPayloadInput,
    options?: {
      fallbackRentLeadId?: string | null;
    },
  ): Promise<ContractSourceSnapshot> {
    if (payload.originType === ContractOriginType.RENT_PIPELINE) {
      const rentLeadId = payload.rentLeadId ?? options?.fallbackRentLeadId ?? null;

      if (!rentLeadId) {
        throw new HttpError(422, "Lead de locacao obrigatorio para esta origem.");
      }

      const rentLead = await prisma.rentLead.findUnique({
        where: { id: rentLeadId },
        select: {
          id: true,
          code: true,
          customerName: true,
          pipelineStage: true,
          status: true,
          property: {
            select: {
              id: true,
              code: true,
              title: true,
              type: true,
              purpose: true,
              status: true,
              city: true,
              district: true,
              street: true,
              streetNumber: true,
              complement: true,
              zipCode: true,
              state: true,
              owner: {
                select: {
                  id: true,
                  fullName: true,
                  document: true,
                  email: true,
                  phone: true,
                  isActive: true,
                },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              fullName: true,
              document: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
        },
      });

      if (!rentLead) {
        throw new HttpError(404, "Lead de locacao nao encontrado.");
      }

      const eligibleLeadStatuses: LeadStatus[] = [
        LeadStatus.OPEN,
        LeadStatus.WON,
      ];

      if (!eligibleLeadStatuses.includes(rentLead.status)) {
        throw new HttpError(
          422,
          "Somente leads ativos podem originar minuta contratual.",
        );
      }

      if (!rentLead.property) {
        throw new HttpError(
          422,
          "Lead de locacao precisa estar vinculado a um imovel.",
        );
      }

      if (!rentLead.tenant) {
        throw new HttpError(
          422,
          "Lead de locacao precisa estar vinculado a um locatario.",
        );
      }

      if (!rentLead.property.owner.isActive) {
        throw new HttpError(422, "Proprietario vinculado esta inativo.");
      }

      if (!rentLead.tenant.isActive) {
        throw new HttpError(422, "Locatario vinculado esta inativo.");
      }

      this.assertPropertyEligibleForContract(rentLead.property);

      return {
        originType: ContractOriginType.RENT_PIPELINE,
        rentLead: {
          id: rentLead.id,
          code: rentLead.code,
          customerName: rentLead.customerName,
          pipelineStage: rentLead.pipelineStage,
          status: rentLead.status,
        },
        property: {
          id: rentLead.property.id,
          code: rentLead.property.code,
          title: rentLead.property.title,
          type: rentLead.property.type,
          purpose: rentLead.property.purpose,
          status: rentLead.property.status,
          city: rentLead.property.city,
          district: rentLead.property.district,
          street: rentLead.property.street,
          streetNumber: rentLead.property.streetNumber,
          complement: rentLead.property.complement,
          zipCode: rentLead.property.zipCode,
          state: rentLead.property.state,
        },
        owner: {
          id: rentLead.property.owner.id,
          fullName: rentLead.property.owner.fullName,
          document: rentLead.property.owner.document,
          email: rentLead.property.owner.email,
          phone: rentLead.property.owner.phone,
        },
        tenant: {
          id: rentLead.tenant.id,
          fullName: rentLead.tenant.fullName,
          document: rentLead.tenant.document,
          email: rentLead.tenant.email,
          phone: rentLead.tenant.phone,
        },
      };
    }

    const propertyId = payload.propertyId;
    const tenantId = payload.tenantId;

    if (!propertyId || !tenantId) {
      throw new HttpError(
        422,
        "Contrato manual exige imovel e locatario selecionados.",
      );
    }

    const [property, tenant] = await Promise.all([
      prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          code: true,
          title: true,
          type: true,
          purpose: true,
          status: true,
          city: true,
          district: true,
          street: true,
          streetNumber: true,
          complement: true,
          zipCode: true,
          state: true,
          owner: {
            select: {
              id: true,
              fullName: true,
              document: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
        },
      }),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          fullName: true,
          document: true,
          email: true,
          phone: true,
          isActive: true,
        },
      }),
    ]);

    if (!property) {
      throw new HttpError(404, "Imovel nao encontrado para o contrato.");
    }

    if (!tenant) {
      throw new HttpError(404, "Locatario nao encontrado para o contrato.");
    }

    if (!property.owner.isActive) {
      throw new HttpError(422, "Proprietario vinculado esta inativo.");
    }

    if (!tenant.isActive) {
      throw new HttpError(422, "Locatario vinculado esta inativo.");
    }

    this.assertPropertyEligibleForContract(property);

    return {
      originType: ContractOriginType.MANUAL,
      rentLead: null,
      property: {
        id: property.id,
        code: property.code,
        title: property.title,
        type: property.type,
        purpose: property.purpose,
        status: property.status,
        city: property.city,
        district: property.district,
        street: property.street,
        streetNumber: property.streetNumber,
        complement: property.complement,
        zipCode: property.zipCode,
        state: property.state,
      },
      owner: {
        id: property.owner.id,
        fullName: property.owner.fullName,
        document: property.owner.document,
        email: property.owner.email,
        phone: property.owner.phone,
      },
      tenant: {
        id: tenant.id,
        fullName: tenant.fullName,
        document: tenant.document,
        email: tenant.email,
        phone: tenant.phone,
      },
    };
  }

  private assertPropertyEligibleForContract(property: {
    purpose: PropertyPurpose;
    status: PropertyStatus;
  }) {
    if (property.purpose === PropertyPurpose.SALE) {
      throw new HttpError(
        422,
        "Imovel cadastrado apenas para venda nao pode receber contrato de locacao.",
      );
    }

    if (property.status === PropertyStatus.SOLD) {
      throw new HttpError(
        422,
        "Imovel vendido nao pode receber contrato de locacao.",
      );
    }

    if (property.status === PropertyStatus.INACTIVE) {
      throw new HttpError(
        422,
        "Imovel inativo precisa ser reabilitado antes da contratacao.",
      );
    }
  }

  private async ensureNoOngoingConflict(
    propertyId: string,
    rentLeadId: string | null,
    excludeContractId?: string,
  ) {
    const conflictingContract = await prisma.contract.findFirst({
      where: {
        id: excludeContractId ? { not: excludeContractId } : undefined,
        status: {
          in: [...ONGOING_CONTRACT_STATUSES],
        },
        OR: [{ propertyId }, ...(rentLeadId ? [{ rentLeadId }] : [])],
      },
      select: {
        id: true,
        code: true,
      },
    });

    if (conflictingContract) {
      throw new HttpError(
        409,
        `Ja existe contrato em andamento para este contexto comercial (${conflictingContract.code}).`,
      );
    }
  }

  private buildTemplateInput(
    payload: ContractPayloadInput,
    snapshot: ContractSourceSnapshot,
    code: string,
    responsibilities: string[],
  ): ContractTemplateInput {
    return {
      contract: {
        code,
        originType: snapshot.originType,
        startDate: payload.startDate,
        endDate: payload.endDate,
        rentAmount: payload.rentAmount,
        dueDay: payload.dueDay,
        guaranteeType: payload.guaranteeType,
        guaranteeDetails: normalizeOptionalString(payload.guaranteeDetails),
        adjustmentIndex: payload.adjustmentIndex,
        adjustmentFrequencyMonths: payload.adjustmentFrequencyMonths,
        lateFeePercentage: payload.lateFeePercentage ?? null,
        penaltyDescription: normalizeOptionalString(payload.penaltyDescription),
        responsibilities,
        additionalClauses: normalizeOptionalString(payload.additionalClauses),
        legalWarningText: DEFAULT_CONTRACT_LEGAL_WARNING,
      },
      property: {
        code: snapshot.property.code,
        title: snapshot.property.title,
        type: snapshot.property.type,
        city: snapshot.property.city,
        district: snapshot.property.district,
        street: snapshot.property.street,
        streetNumber: snapshot.property.streetNumber,
        complement: snapshot.property.complement,
        zipCode: snapshot.property.zipCode,
        state: snapshot.property.state,
      },
      owner: snapshot.owner,
      tenant: snapshot.tenant,
      rentLead: snapshot.rentLead
        ? {
            code: snapshot.rentLead.code,
            customerName: snapshot.rentLead.customerName,
          }
        : null,
    };
  }

  private buildCode(code?: string | null) {
    if (code && code.trim().length > 0) {
      return code.trim().toUpperCase();
    }

    return `CTR-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private buildPdfUrl(contractId: string, versionId: string) {
    return `/api/contracts/${contractId}/versions/${versionId}/pdf`;
  }

  private async syncRentLeadStage(
    tx: Prisma.TransactionClient,
    rentLeadId: string,
    stage: "generated" | "signature-pending" | "active",
  ) {
    if (stage === "active") {
      await tx.rentLead.update({
        where: { id: rentLeadId },
        data: {
          pipelineStage: RentLeadStage.ACTIVE,
          status: LeadStatus.WON,
          closedAt: new Date(),
        },
      });
      return;
    }

    await tx.rentLead.update({
      where: { id: rentLeadId },
      data: {
        pipelineStage:
          stage === "signature-pending"
            ? RentLeadStage.SIGNATURE_PENDING
            : RentLeadStage.CONTRACT_GENERATED,
        status: LeadStatus.OPEN,
        closedAt: null,
      },
    });
  }

  private async reopenPropertyIfAvailable(
    tx: Prisma.TransactionClient,
    propertyId: string,
    currentContractId: string,
    purpose: PropertyPurpose,
  ) {
    const activeSibling = await tx.contract.count({
      where: {
        id: { not: currentContractId },
        propertyId,
        status: {
          in: [...ONGOING_CONTRACT_STATUSES],
        },
      },
    });

    if (activeSibling > 0) {
      return;
    }

    await tx.property.update({
      where: { id: propertyId },
      data: {
        status: PropertyStatus.AVAILABLE,
        commercialSituation: this.resolveAvailableCommercialSituation(purpose),
      },
    });
  }

  private resolveAvailableCommercialSituation(purpose: PropertyPurpose) {
    if (purpose === PropertyPurpose.RENT) {
      return "AVAILABLE_FOR_RENT" as const;
    }

    if (purpose === PropertyPurpose.BOTH) {
      return "AVAILABLE_FOR_BOTH" as const;
    }

    return "AVAILABLE_FOR_SALE" as const;
  }

  private async audit(
    action: string,
    entityId: string,
    code: string,
    entityType: AuditEntityType,
    context: RequestContext,
    metadata: unknown,
  ) {
    await createAuditLog({
      actorUserId: context.actorUserId,
      action,
      entityType,
      entityId,
      description: `Registro ${code} sofreu atualizacao operacional.`,
      metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}
