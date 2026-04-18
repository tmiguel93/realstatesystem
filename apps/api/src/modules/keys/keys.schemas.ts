import { HolderType, KeyStatus } from "@prisma/client";
import { z } from "zod";

const optionalString = z.string().trim().optional().nullable();

export const keysListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().trim().optional(),
  status: z.nativeEnum(KeyStatus).optional(),
  propertyId: z.string().uuid().optional(),
  onlyOverdue: z
    .enum(["true", "false"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === "true",
    ),
});

export const keyPayloadSchema = z.object({
  propertyId: z.string().uuid("Selecione o imovel."),
  identifier: z.string().trim().min(1, "Informe o identificador da chave."),
  description: optionalString,
  isCopy: z.boolean().default(false),
});

export const keyCheckoutPayloadSchema = z.object({
  holderType: z.nativeEnum(HolderType),
  holderName: z.string().trim().min(3, "Informe quem retirou a chave."),
  holderDocument: optionalString,
  checkoutAt: z.coerce.date().optional().nullable(),
  expectedReturnAt: z.coerce.date().optional().nullable(),
  notes: optionalString,
  overrideReason: optionalString,
});

export const keyCheckinPayloadSchema = z.object({
  returnedAt: z.coerce.date().optional().nullable(),
  notes: optionalString,
});

export const keyStatusPayloadSchema = z.object({
  status: z.nativeEnum(KeyStatus),
  notes: optionalString,
  overrideReason: optionalString,
});

export const keyIdParamSchema = z.object({
  id: z.string().uuid("Identificador invalido."),
});
