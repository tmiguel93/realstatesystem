import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  allPermissions,
  roleCodes,
  rolePermissionMap,
} from "@imobiliaria/shared";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/imobiliaria",
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL ?? "admin@imobiliaria.local";
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  for (const permissionCode of allPermissions) {
    const [resource = "general", action = "read"] = permissionCode.split(".");

    await prisma.permission.upsert({
      where: { code: permissionCode },
      update: {
        resource,
        action,
      },
      create: {
        code: permissionCode,
        resource,
        action,
        description: `Permissao para ${permissionCode}`,
      },
    });
  }

  for (const roleCode of Object.values(roleCodes)) {
    await prisma.role.upsert({
      where: { code: roleCode },
      update: {
        name: roleCode === roleCodes.MASTER_ADMIN ? "Master Admin" : "Usuario Operacional",
        isSystem: true,
      },
      create: {
        code: roleCode,
        name: roleCode === roleCodes.MASTER_ADMIN ? "Master Admin" : "Usuario Operacional",
        description:
          roleCode === roleCodes.MASTER_ADMIN
            ? "Perfil com acesso total ao sistema."
            : "Perfil operacional com acesso limitado.",
        isSystem: true,
      },
    });
  }

  for (const [roleCode, permissions] of Object.entries(rolePermissionMap)) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { code: roleCode },
    });

    for (const permissionCode of permissions) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { code: permissionCode },
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: "Administrador Master",
      passwordHash: adminPasswordHash,
      status: "ACTIVE",
    },
    create: {
      fullName: "Administrador Master",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      status: "ACTIVE",
    },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { code: roleCodes.MASTER_ADMIN },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  const operationalUser = await prisma.user.upsert({
    where: { email: "operacional@imobiliaria.local" },
    update: {
      fullName: "Usuario Operacional",
      passwordHash: adminPasswordHash,
      status: "ACTIVE",
    },
    create: {
      fullName: "Usuario Operacional",
      email: "operacional@imobiliaria.local",
      passwordHash: adminPasswordHash,
      status: "ACTIVE",
    },
  });

  const operationalRole = await prisma.role.findUniqueOrThrow({
    where: { code: roleCodes.USER_OPERACIONAL },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: operationalUser.id,
        roleId: operationalRole.id,
      },
    },
    update: {},
    create: {
      userId: operationalUser.id,
      roleId: operationalRole.id,
    },
  });

  console.log("Seed concluido.");
  console.log(`Admin: ${adminEmail}`);
  console.log("Senha inicial definida pelo .env.");
  console.log("Usuario operacional: operacional@imobiliaria.local");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
