import {
  AuditEntityType,
  LocaleCode,
  Prisma,
  ThemePreference,
  UserStatus,
} from "@prisma/client";
import { comparePassword, hashPassword } from "../../core/password";
import { prisma } from "../../core/prisma";
import { HttpError } from "../../core/http-error";
import {
  createRandomToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../core/jwt";
import { env } from "../../config/env";
import { createAuditLog } from "../../core/audit";

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

type UserPreferencesInput = {
  preferredTheme: ThemePreference;
  preferredLocale: LocaleCode;
};

type UserWithAccess = Prisma.UserGetPayload<{
  include: {
    roles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export class AuthService {
  async login(
    email: string,
    password: string,
    context: RequestContext,
  ) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new HttpError(401, "Email ou senha invalidos.");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new HttpError(403, "Usuario inativo ou bloqueado.");
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      throw new HttpError(401, "Email ou senha invalidos.");
    }

    const serializedUser = this.serializeUser(user);
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      roles: serializedUser.roles,
      permissions: serializedUser.permissions,
    });

    const refreshToken = signRefreshToken({
      sub: user.id,
      sessionId: createRandomToken(16),
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    await createAuditLog({
      actorUserId: user.id,
      action: "auth.login",
      entityType: "AUTH",
      entityId: user.id,
      description: `Login realizado por ${user.email}.`,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: serializedUser,
    };
  }

  async refresh(token: string | undefined, context: RequestContext) {
    if (!token) {
      throw new HttpError(401, "Refresh token ausente.");
    }

    try {
      verifyRefreshToken(token);
    } catch {
      throw new HttpError(401, "Refresh token invalido ou expirado.");
    }

    const tokenHash = hashToken(token);

    const refreshTokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!refreshTokenRecord || refreshTokenRecord.revokedAt) {
      throw new HttpError(401, "Sessao invalida.");
    }

    if (refreshTokenRecord.expiresAt.getTime() < Date.now()) {
      throw new HttpError(401, "Sessao expirada.");
    }

    const serializedUser = this.serializeUser(refreshTokenRecord.user);
    const accessToken = signAccessToken({
      sub: refreshTokenRecord.user.id,
      email: refreshTokenRecord.user.email,
      roles: serializedUser.roles,
      permissions: serializedUser.permissions,
    });

    const newRefreshToken = signRefreshToken({
      sub: refreshTokenRecord.user.id,
      sessionId: createRandomToken(16),
    });

    await prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: {
        revokedAt: new Date(),
      },
    });

    await prisma.refreshToken.create({
      data: {
        userId: refreshTokenRecord.user.id,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: serializedUser,
    };
  }

  async logout(refreshToken: string | undefined, actorUserId?: string) {
    if (!refreshToken) {
      return;
    }

    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken) },
      data: { revokedAt: new Date() },
    });

    if (actorUserId) {
      await createAuditLog({
        actorUserId,
        action: "auth.logout",
        entityType: "AUTH",
        entityId: actorUserId,
        description: "Logout realizado.",
      });
    }
  }

  async forgotPassword(email: string, context: RequestContext) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        message:
          "Se o email existir em nossa base, enviaremos as instrucoes de redefinicao.",
      };
    }

    const rawToken = createRandomToken();
    const tokenHash = hashToken(rawToken);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await createAuditLog({
      actorUserId: user.id,
      action: "auth.forgot-password",
      entityType: "AUTH",
      entityId: user.id,
      description: "Solicitacao de recuperacao de senha registrada.",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      message:
        "Se o email existir em nossa base, enviaremos as instrucoes de redefinicao.",
      previewToken: env.NODE_ENV === "development" ? rawToken : undefined,
    };
  }

  async resetPassword(token: string, newPassword: string, context: RequestContext) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt) {
      throw new HttpError(400, "Token invalido.");
    }

    if (resetToken.expiresAt.getTime() < Date.now()) {
      throw new HttpError(400, "Token expirado.");
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: {
        usedAt: new Date(),
      },
    });

    await prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await createAuditLog({
      actorUserId: resetToken.userId,
      action: "auth.reset-password",
      entityType: "AUTH",
      entityId: resetToken.userId,
      description: "Senha redefinida com sucesso.",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      message: "Senha redefinida com sucesso.",
    };
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new HttpError(404, "Usuario nao encontrado.");
    }

    return this.serializeUser(user);
  }

  async updatePreferences(
    userId: string,
    payload: UserPreferencesInput,
    context: RequestContext,
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        preferredTheme: payload.preferredTheme,
        preferredLocale: payload.preferredLocale,
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    await createAuditLog({
      actorUserId: userId,
      action: "auth.update-preferences",
      entityType: AuditEntityType.USER,
      entityId: userId,
      description: "Preferências de tema e idioma foram atualizadas.",
      metadata: payload,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return this.serializeUser(user);
  }

  private serializeUser(user: UserWithAccess) {
    const roles = user.roles.map((item) => item.role.code);
    const permissions = Array.from<string>(
      new Set(
        user.roles.flatMap((item) =>
          item.role.permissions.map(
            (permissionItem) => permissionItem.permission.code,
          ),
        ),
      ),
    );

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      status: user.status,
      roles,
      permissions,
      lastLoginAt: user.lastLoginAt,
      preferredTheme: user.preferredTheme,
      preferredLocale: user.preferredLocale,
    };
  }
}
