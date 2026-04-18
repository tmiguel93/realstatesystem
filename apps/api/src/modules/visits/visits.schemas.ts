import { VisitOutcome, VisitStatus } from "@prisma/client";
import { z } from "zod";

const optionalString = z.string().trim().optional().nullable();

export const visitsListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  status: z.nativeEnum(VisitStatus).optional(),
  propertyId: z.string().uuid().optional(),
  brokerUserId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const visitPayloadSchema = z.object({
  propertyId: z.string().uuid("Selecione o imovel."),
  saleLeadId: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value ? value : null)),
  rentLeadId: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value ? value : null)),
  brokerUserId: z.string().uuid("Selecione o corretor responsavel."),
  scheduledAt: z.coerce.date(),
  status: z.nativeEnum(VisitStatus).default(VisitStatus.SCHEDULED),
  completedAt: z.coerce.date().optional().nullable(),
  outcome: z.nativeEnum(VisitOutcome).optional().nullable(),
  notes: optionalString,
  resultSummary: optionalString,
});

export const visitIdParamSchema = z.object({
  id: z.string().uuid("Identificador invalido."),
});
