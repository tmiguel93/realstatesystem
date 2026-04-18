import { LeadSource, LeadStatus, SaleLeadStage } from "@prisma/client";
import { z } from "zod";

const optionalString = z.string().trim().optional().nullable();

export const saleLeadsListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().trim().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  pipelineStage: z.nativeEnum(SaleLeadStage).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  propertyId: z.string().uuid().optional(),
  responsibleUserId: z.string().uuid().optional(),
});

export const saleLeadPayloadSchema = z.object({
  code: optionalString,
  pipelineStage: z.nativeEnum(SaleLeadStage),
  status: z.nativeEnum(LeadStatus),
  source: z.nativeEnum(LeadSource).optional().nullable(),
  customerName: z.string().trim().min(3, "Informe o nome do cliente."),
  customerEmail: z
    .union([z.string().trim().email(), z.literal(""), z.null()])
    .optional(),
  customerPhone: optionalString,
  customerDocument: optionalString,
  desiredRegion: optionalString,
  budgetMin: z.coerce.number().optional().nullable(),
  budgetMax: z.coerce.number().optional().nullable(),
  notes: optionalString,
  lossReason: optionalString,
  lastContactAt: z.coerce.date().optional().nullable(),
  nextFollowUpAt: z.coerce.date().optional().nullable(),
  propertyId: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value ? value : null)),
  responsibleUserId: z.string().uuid("Selecione o responsavel."),
});

export const saleLeadIdParamSchema = z.object({
  id: z.string().uuid("Identificador invalido."),
});
