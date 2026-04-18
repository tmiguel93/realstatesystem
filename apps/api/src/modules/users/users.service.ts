import { AuditEntityType, Prisma, UserStatus } from "@prisma/client";
import { roleCodes } from "@imobiliaria/shared";
import { prisma } from "../../core/prisma";
import { HttpError } from "../../core/http-error";
import { buildPaginationMeta, resolvePagination } from "../../core/pagination";
import { createAuditLog } from "../../core/audit";
import { rethrowPrismaError } from "../../core/prisma-error";
import { hashPassword } from "../../core/password";

type UsersListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: UserStatus;
  roleCode?: string;
};

type RequestContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

type CreateUserPayload = {
  fullName: string;
  email: string;
  phone?: string | null;
  status: UserStatus;
  mustChangePassword: boolean;
  roleCodes: string[];
  tenantPortalTenantId?: string | null;
  password?: string;
};

type UpdateUserPayload = Omit<CreateUserPayload, "password">;

function normalizeOptionalString(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function mapUserBase(user: {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  roles: Array<{
    role: {
      code: string;
      name: string;
      permissions: Array<{ permission: { code: string } }>;
    };
  }>;
}) {
  const roleCodes = user.roles.map((item) => item.role.code);
  const permissionCount = new Set(
    user.roles.flatMap((item) =>
      item.role.permissions.map((permissionItem) => permissionItem.permission.code),
    ),
  ).size;

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    roleCodes,
    permissionCount,
  };
}

export class UsersService {
  async list(query: UsersListQuery) {
    const { page, pageSize, skip, take } = resolvePagination(query);
    const where: Prisma.UserWhereInput = {
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
              { phone: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.roleCode
        ? {
            roles: {
              some: {
                role: {
                  code: query.roleCode,
                },
              },
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
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
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: items.map(mapUserBase),
      meta: buildPaginationMeta(total, page, pageSize),
    };
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
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

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { actorUserId: id },
          { entityType: AuditEntityType.USER, entityId: id },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    return {
      ...mapUserBase(user),
      permissions: Array.from(
        new Set(
          user.roles.flatMap((item) =>
            item.role.permissions.map((permissionItem) => permissionItem.permission.code),
          ),
        ),
      ),
      auditLogs,
    };
  }

  async create(payload: CreateUserPayload, context: RequestContext) {
    if (!payload.password) {
      throw new HttpError(422, "A senha inicial e obrigatoria.");
    }

    const roles = await this.getRolesByCodes(payload.roleCodes);
    await this.ensureTenantPortalLinkValidity(payload.roleCodes, payload.tenantPortalTenantId);
    const passwordHash = await hashPassword(payload.password);

    try {
      const user = await prisma.user.create({
        data: {
          fullName: payload.fullName.trim(),
          email: payload.email.trim().toLowerCase(),
          phone: normalizeOptionalString(payload.phone),
          status: payload.status,
          mustChangePassword: payload.mustChangePassword,
          passwordHash,
          roles: {
            create: roles.map((role) => ({
              roleId: role.id,
            })),
          },
          tenantPortalAccesses:
            payload.roleCodes.includes(roleCodes.TENANT_PORTAL) &&
            payload.tenantPortalTenantId
              ? {
                  create: {
                    tenantId: payload.tenantPortalTenantId,
                    status: "ACTIVE",
                  },
                }
              : undefined,
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

      await this.audit("users.create", user.id, user.email, context, {
        ...payload,
        password: undefined,
      });

      return mapUserBase(user);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao criar usuario.");
    }
  }

  async update(id: string, payload: UpdateUserPayload, context: RequestContext) {
    const roles = await this.getRolesByCodes(payload.roleCodes);
    await this.ensureTenantPortalLinkValidity(payload.roleCodes, payload.tenantPortalTenantId);

    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          fullName: payload.fullName.trim(),
          email: payload.email.trim().toLowerCase(),
          phone: normalizeOptionalString(payload.phone),
          status: payload.status,
          mustChangePassword: payload.mustChangePassword,
          roles: {
            deleteMany: {},
            create: roles.map((role) => ({
              roleId: role.id,
            })),
          },
          tenantPortalAccesses:
            payload.roleCodes.includes(roleCodes.TENANT_PORTAL) &&
            payload.tenantPortalTenantId
              ? {
                  deleteMany: {},
                  create: {
                    tenantId: payload.tenantPortalTenantId,
                    status: "ACTIVE",
                  },
                }
              : {
                  deleteMany: {},
                },
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

      await this.audit("users.update", id, user.email, context, payload);

      return mapUserBase(user);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao atualizar usuario.");
    }
  }

  async updateStatus(
    id: string,
    status: UserStatus,
    context: RequestContext,
  ) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { status },
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

      await this.audit("users.update-status", id, user.email, context, { status });

      return mapUserBase(user);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao atualizar status do usuario.");
    }
  }

  async resetPassword(
    id: string,
    newPassword: string,
    mustChangePassword: boolean,
    context: RequestContext,
  ) {
    const passwordHash = await hashPassword(newPassword);

    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          passwordHash,
          mustChangePassword,
        },
      });

      await prisma.refreshToken.updateMany({
        where: {
          userId: id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await this.audit("users.reset-password", id, user.email, context, {
        mustChangePassword,
      });

      return {
        id: user.id,
        message: "Senha redefinida com sucesso.",
      };
    } catch (error) {
      rethrowPrismaError(error, "Falha ao redefinir senha.");
    }
  }

  async listRoles() {
    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      permissionCodes: role.permissions.map((item) => item.permission.code),
    }));
  }

  async listPermissions() {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });

    return permissions.map((permission) => ({
      id: permission.id,
      code: permission.code,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
    }));
  }

  async updateRolePermissions(
    roleId: string,
    permissionCodes: string[],
    context: RequestContext,
  ) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        code: true,
        name: true,
        isSystem: true,
      },
    });

    if (!role) {
      throw new HttpError(404, "Perfil não encontrado.");
    }

    const permissions = await prisma.permission.findMany({
      where: {
        code: {
          in: permissionCodes,
        },
      },
      select: {
        id: true,
        code: true,
      },
    });

    if (permissions.length !== permissionCodes.length) {
      throw new HttpError(422, "Uma ou mais permissões são inválidas.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId,
          permissionId: permission.id,
        })),
      });
    });

    await createAuditLog({
      actorUserId: context.actorUserId,
      action: "roles.permissions.update",
      entityType: AuditEntityType.ROLE,
      entityId: roleId,
      description: `Permissões do perfil ${role.name} foram atualizadas.`,
      metadata: {
        roleCode: role.code,
        permissionCodes,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return this.listRoles();
  }

  async listAssignable() {
    const users = await prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
      },
      orderBy: { fullName: "asc" },
      include: {
        roles: {
          include: {
            role: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      roleCodes: user.roles.map((item) => item.role.code),
    }));
  }

  private async getRolesByCodes(roleCodes: string[]) {
    const roles = await prisma.role.findMany({
      where: {
        code: {
          in: roleCodes,
        },
      },
    });

    if (roles.length !== roleCodes.length) {
      throw new HttpError(422, "Um ou mais perfis informados sao invalidos.");
    }

    return roles;
  }

  private async ensureTenantPortalLinkValidity(
    userRoleCodes: string[],
    tenantPortalTenantId?: string | null,
  ) {
    if (!userRoleCodes.includes(roleCodes.TENANT_PORTAL)) {
      return;
    }

    if (!tenantPortalTenantId) {
      throw new HttpError(
        422,
        "Selecione o locatário vinculado ao perfil do portal.",
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantPortalTenantId },
      select: { id: true },
    });

    if (!tenant) {
      throw new HttpError(404, "Locatário do portal não encontrado.");
    }
  }

  private async audit(
    action: string,
    entityId: string,
    email: string,
    context: RequestContext,
    metadata: unknown,
  ) {
    await createAuditLog({
      actorUserId: context.actorUserId,
      action,
      entityType: AuditEntityType.USER,
      entityId,
      description: `Usuario ${email} sofreu alteracao administrativa.`,
      metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}
