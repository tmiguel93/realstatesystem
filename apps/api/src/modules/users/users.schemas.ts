import { UserStatus } from "@prisma/client";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter no minimo 8 caracteres.")
  .regex(/[A-Z]/, "A senha deve ter ao menos uma letra maiuscula.")
  .regex(/[a-z]/, "A senha deve ter ao menos uma letra minuscula.")
  .regex(/[0-9]/, "A senha deve ter ao menos um numero.");

export const usersListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().trim().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  roleCode: z.string().trim().optional(),
});

export const userPayloadSchema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo."),
  email: z.string().trim().email("Informe um email valido."),
  phone: z.union([z.string().trim(), z.literal(""), z.null()]).optional(),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
  mustChangePassword: z.boolean().default(true),
  roleCodes: z.array(z.string().trim().min(1)).min(1, "Selecione ao menos um perfil."),
  tenantPortalTenantId: z.string().uuid().optional().nullable(),
  password: passwordSchema.optional(),
});

export const userUpdatePayloadSchema = userPayloadSchema.omit({
  password: true,
});

export const userIdParamSchema = z.object({
  id: z.string().uuid("Identificador invalido."),
});

export const userStatusPayloadSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const userResetPasswordSchema = z.object({
  newPassword: passwordSchema,
  mustChangePassword: z.boolean().default(true),
});

export const rolePermissionUpdateSchema = z.object({
  permissionCodes: z
    .array(z.string().trim().min(1))
    .min(1, "Selecione ao menos uma permissão."),
});
