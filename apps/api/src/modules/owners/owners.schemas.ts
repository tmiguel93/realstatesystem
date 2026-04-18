import { PersonType } from "@prisma/client";
import { z } from "zod";

const optionalString = z.string().trim().optional().nullable();

export const ownersListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().trim().optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === "true",
    ),
});

export const ownerPayloadSchema = z.object({
  personType: z.nativeEnum(PersonType),
  fullName: z.string().trim().min(3, "Informe o nome completo."),
  document: z.string().trim().min(11, "Informe CPF ou CNPJ."),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  phone: optionalString,
  secondaryPhone: optionalString,
  zipCode: optionalString,
  state: z
    .union([z.string().trim().length(2), z.literal(""), z.null()])
    .optional(),
  city: optionalString,
  district: optionalString,
  street: optionalString,
  streetNumber: optionalString,
  complement: optionalString,
  bankName: optionalString,
  bankBranch: optionalString,
  bankAccount: optionalString,
  pixKey: optionalString,
  notes: optionalString,
  isActive: z.boolean().default(true),
});

export const ownerIdParamSchema = z.object({
  id: z.string().uuid("Identificador invalido."),
});

