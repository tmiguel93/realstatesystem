import {
  AdjustmentIndex,
  ContractChecklistItemStatus,
  ContractChecklistItemType,
  ContractOriginType,
  ContractStatus,
  ContractVersionStatus,
  GuaranteeType,
} from "@prisma/client";
import { z } from "zod";

const optionalString = z.string().trim().optional().nullable();
const optionalUuid = z
  .union([z.string().uuid(), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value ? value : null));

const contractChecklistItemSchema = z.object({
  itemType: z.nativeEnum(ContractChecklistItemType),
  status: z.nativeEnum(ContractChecklistItemStatus),
  isRequired: z.boolean().default(true),
  responsibleUserId: optionalUuid,
  completedAt: z.coerce.date().optional().nullable(),
  notes: optionalString,
  attachmentFileUrl: z
    .union([z.string().trim().url("Informe uma URL valida."), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value ? value : null)),
});

export const contractsListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().trim().optional(),
  status: z.nativeEnum(ContractStatus).optional(),
  propertyId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  rentLeadId: z.string().uuid().optional(),
  onlyExpiring: z
    .enum(["true", "false"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === "true",
    ),
});

export const contractPayloadSchema = z
  .object({
    code: optionalString,
    originType: z.nativeEnum(ContractOriginType),
    rentLeadId: optionalUuid,
    propertyId: optionalUuid,
    tenantId: optionalUuid,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    rentAmount: z.coerce.number().positive("Informe o valor do aluguel."),
    dueDay: z.coerce
      .number()
      .int("Informe um dia de vencimento valido.")
      .min(1, "O vencimento deve estar entre 1 e 31.")
      .max(31, "O vencimento deve estar entre 1 e 31."),
    guaranteeType: z.nativeEnum(GuaranteeType),
    guaranteeDetails: optionalString,
    adjustmentIndex: z.nativeEnum(AdjustmentIndex),
    adjustmentFrequencyMonths: z.coerce
      .number()
      .int("Informe a periodicidade do reajuste.")
      .min(1, "A periodicidade deve ser de no minimo 1 mes.")
      .max(60, "A periodicidade deve ser de no maximo 60 meses."),
    lateFeePercentage: z.coerce
      .number()
      .min(0, "A multa nao pode ser negativa.")
      .max(100, "A multa nao pode ultrapassar 100%.")
      .optional()
      .nullable(),
    penaltyDescription: optionalString,
    responsibilities: z.array(z.string().trim().min(1)).default([]),
    additionalClauses: optionalString,
    checklistItems: z.array(contractChecklistItemSchema).default([]),
    checklistOverrideReason: optionalString,
    legalWarningAcknowledged: z
      .boolean()
      .refine(
        (value) => value,
        "Confirme a validacao juridica obrigatoria antes de gerar a minuta.",
      ),
  })
  .superRefine((value, context) => {
    if (value.endDate <= value.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "A data final deve ser posterior a data inicial.",
      });
    }

    if (
      value.originType === ContractOriginType.RENT_PIPELINE &&
      !value.rentLeadId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rentLeadId"],
        message: "Selecione um lead de locacao para gerar a minuta.",
      });
    }

    if (value.originType === ContractOriginType.MANUAL) {
      if (!value.propertyId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["propertyId"],
          message: "Selecione o imovel da locacao.",
        });
      }

      if (!value.tenantId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tenantId"],
          message: "Selecione o locatario da locacao.",
        });
      }
    }

    const checklistTypes = new Set<ContractChecklistItemType>();
    for (const item of value.checklistItems) {
      if (checklistTypes.has(item.itemType)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["checklistItems"],
          message: "O checklist possui itens duplicados.",
        });
        break;
      }

      checklistTypes.add(item.itemType);
    }
  });

export const contractReviewPayloadSchema = z.object({
  status: z
    .nativeEnum(ContractVersionStatus)
    .refine(
      (status) =>
        status === ContractVersionStatus.REVIEWED ||
        status === ContractVersionStatus.FINALIZED,
      "Selecione um status de revisao valido.",
    ),
});

export const contractStatusPayloadSchema = z.object({
  status: z
    .nativeEnum(ContractStatus)
    .refine(
      (status) =>
        status === ContractStatus.ACTIVE ||
        status === ContractStatus.TERMINATED ||
        status === ContractStatus.CANCELLED ||
        status === ContractStatus.EXPIRED ||
        status === ContractStatus.RENEWED,
      "Selecione um status operacional valido.",
    ),
  terminationReason: optionalString,
});

export const contractIdParamSchema = z.object({
  id: z.string().uuid("Identificador invalido."),
});

export const contractVersionParamsSchema = z.object({
  id: z.string().uuid("Identificador invalido."),
  versionId: z.string().uuid("Versao invalida."),
});

const leaseTerminationLineItemSchema = z.object({
  label: z.string().trim().min(2, "Informe um rótulo válido."),
  amount: z.coerce.number().nonnegative("Informe um valor válido."),
});

export const leaseTerminationRulePayloadSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(3, "Informe o nome da regra."),
  penaltyPercentage: z.coerce
    .number()
    .min(0, "O percentual não pode ser negativo.")
    .max(100, "O percentual não pode ser maior que 100."),
  proportionalByRemainingTime: z.boolean().default(true),
  allowManualAdjustments: z.boolean().default(true),
  additionalCharges: z.array(leaseTerminationLineItemSchema).default([]),
  discounts: z.array(leaseTerminationLineItemSchema).default([]),
  formulaDescription: z
    .string()
    .trim()
    .min(4, "Informe a descrição da fórmula.")
    .default("multa_base * proporção do tempo restante + adicionais - descontos"),
  standardNotes: optionalString,
  legalSupportText: optionalString,
  active: z.boolean().default(true),
});

export const leaseTerminationSimulationPayloadSchema = z.object({
  ruleId: optionalUuid,
  manualPenaltyPercentage: z.coerce
    .number()
    .min(0, "O percentual manual não pode ser negativo.")
    .max(100, "O percentual manual não pode ser maior que 100.")
    .nullable()
    .optional(),
  additionalCharges: z.array(leaseTerminationLineItemSchema).default([]),
  discounts: z.array(leaseTerminationLineItemSchema).default([]),
  reason: optionalString,
  notes: optionalString,
});

export const leaseTerminationConfirmPayloadSchema = z.object({
  simulationId: z.string().uuid("Selecione uma simulação válida."),
  reason: z
    .string()
    .trim()
    .min(3, "Informe o motivo da baixa contratual."),
  finalNotes: optionalString,
});

export type ContractPayloadInput = z.infer<typeof contractPayloadSchema>;
export type ContractReviewPayloadInput = z.infer<
  typeof contractReviewPayloadSchema
>;
export type ContractStatusPayloadInput = z.infer<
  typeof contractStatusPayloadSchema
>;
export type LeaseTerminationRulePayloadInput = z.infer<
  typeof leaseTerminationRulePayloadSchema
>;
export type LeaseTerminationSimulationPayloadInput = z.infer<
  typeof leaseTerminationSimulationPayloadSchema
>;
export type LeaseTerminationConfirmPayloadInput = z.infer<
  typeof leaseTerminationConfirmPayloadSchema
>;
