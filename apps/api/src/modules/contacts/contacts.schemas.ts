import { ContactRoleType, PersonType } from "@prisma/client";
import { z } from "zod";

const optionalString = z.string().trim().optional().nullable();

export const contactsListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().trim().optional(),
  role: z.nativeEnum(ContactRoleType).optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === "true",
    ),
});

export const contactPayloadSchema = z.object({
  personType: z.nativeEnum(PersonType),
  fullName: z.string().trim().min(3, "Informe o nome completo."),
  document: optionalString,
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
  notes: optionalString,
  isActive: z.boolean().default(true),
  roles: z
    .array(z.nativeEnum(ContactRoleType))
    .min(1, "Selecione ao menos um papel do contato.")
    .transform((roles) => Array.from(new Set(roles))),
});

export const contactIdParamSchema = z.object({
  id: z.string().uuid("Identificador inválido."),
});
