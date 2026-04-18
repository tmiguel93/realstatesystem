import { MaintenanceTicketType } from "@prisma/client";
import { z } from "zod";

const optionalString = z.string().trim().optional().nullable();

export const tenantPortalMaintenanceCreateSchema = z.object({
  propertyId: z.string().uuid("Selecione um imóvel válido."),
  type: z.nativeEnum(MaintenanceTicketType),
  description: z
    .string()
    .trim()
    .min(12, "Descreva o problema com mais detalhes."),
  complementaryNotes: optionalString,
});
