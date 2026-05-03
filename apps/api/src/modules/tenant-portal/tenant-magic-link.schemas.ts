import { MaintenanceTicketType } from "@prisma/client";
import { z } from "zod";

const optionalString = z.string().trim().optional().nullable();

export const tenantMagicLinkGenerateSchema = z.object({
  expiresInDays: z.coerce.number().int().min(1).max(180).default(30),
});

export const tenantMagicLinkTicketCreateSchema = z.object({
  type: z.nativeEnum(MaintenanceTicketType),
  description: z
    .string()
    .trim()
    .min(12, "Descreva o problema com mais detalhes."),
  complementaryNotes: optionalString,
});
