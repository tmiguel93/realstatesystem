import { LocaleCode, ThemePreference } from "@prisma/client";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter no minimo 8 caracteres.")
  .regex(/[A-Z]/, "A senha deve ter ao menos uma letra maiuscula.")
  .regex(/[a-z]/, "A senha deve ter ao menos uma letra minuscula.")
  .regex(/[0-9]/, "A senha deve ter ao menos um numero.");

export const loginSchema = z.object({
  email: z.string().email("Informe um email valido."),
  senha: z.string().min(1, "Informe a senha."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Informe um email valido."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token obrigatorio."),
  novaSenha: passwordSchema,
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export const userPreferencesSchema = z.object({
  preferredTheme: z.nativeEnum(ThemePreference),
  preferredLocale: z.nativeEnum(LocaleCode),
});
