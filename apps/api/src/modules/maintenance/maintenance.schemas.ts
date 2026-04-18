import {
  MaintenanceTicketStatus,
  MaintenanceTicketType,
} from "@prisma/client";
import { z } from "zod";

const optionalString = z.string().trim().optional().nullable();

export const maintenanceTicketIdParamSchema = z.object({
  id: z.string().uuid("Identificador invalido."),
});

export const maintenancePropertyContextQuerySchema = z
  .object({
    propertyId: z.string().uuid().optional(),
    propertyCode: z.string().trim().optional(),
  })
  .refine(
    (value) => Boolean(value.propertyId || value.propertyCode),
    "Informe um imovel para consulta.",
  );

export const maintenanceTicketAttachmentSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do anexo."),
  fileUrl: z.string().trim().url("Informe uma URL valida para o anexo."),
  mimeType: z
    .string()
    .trim()
    .min(3, "Informe o tipo do arquivo.")
    .default("image/jpeg"),
  sizeBytes: z.coerce.number().int().nonnegative().default(0),
});

export const maintenanceTicketsListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().trim().optional(),
  propertyId: z.string().uuid().optional(),
  status: z.nativeEnum(MaintenanceTicketStatus).optional(),
  type: z.nativeEnum(MaintenanceTicketType).optional(),
  urgencyLevel: z.coerce.number().int().min(1).max(5).optional(),
  assignedToUserId: z.string().uuid().optional(),
  openedByUserId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  onlyCritical: z
    .enum(["true", "false"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === "true",
    ),
});

export const maintenanceTicketCreateSchema = z.object({
  propertyId: z.string().uuid("Selecione um imovel valido."),
  tenantId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(4, "Informe um titulo curto para o chamado."),
  description: z
    .string()
    .trim()
    .min(12, "Descreva o chamado com um pouco mais de contexto."),
  type: z.nativeEnum(MaintenanceTicketType),
  urgencyLevel: z.coerce.number().int().min(1).max(5).optional().nullable(),
  assignedToUserId: z.string().uuid().optional().nullable(),
  internalNotes: optionalString,
  attachments: z.array(maintenanceTicketAttachmentSchema).default([]),
});

export const maintenanceTicketUpdateSchema = maintenanceTicketCreateSchema
  .partial()
  .extend({
    attachments: z.array(maintenanceTicketAttachmentSchema).optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo para atualizar.",
  );

export const maintenanceTicketStatusSchema = z.object({
  status: z.nativeEnum(MaintenanceTicketStatus),
  resolutionSummary: optionalString,
  cancelReason: optionalString,
  internalNotes: optionalString,
  assignedToUserId: z.string().uuid().optional().nullable(),
});
