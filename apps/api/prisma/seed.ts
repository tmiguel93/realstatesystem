import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  allPermissions,
  permissionLabels,
  roleCodes,
  roleLabels,
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
        description: permissionLabels[permissionCode] ?? permissionCode,
      },
      create: {
        code: permissionCode,
        resource,
        action,
        description: permissionLabels[permissionCode] ?? permissionCode,
      },
    });
  }

  for (const roleCode of Object.values(roleCodes)) {
    await prisma.role.upsert({
      where: { code: roleCode },
      update: {
        name: roleLabels[roleCode] ?? roleCode,
        description: `Perfil sistêmico ${roleLabels[roleCode] ?? roleCode}.`,
        isSystem: true,
      },
      create: {
        code: roleCode,
        name: roleLabels[roleCode] ?? roleCode,
        description: `Perfil sistêmico ${roleLabels[roleCode] ?? roleCode}.`,
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
      preferredLocale: "PT_BR",
      preferredTheme: "SYSTEM",
    },
    create: {
      fullName: "Administrador Master",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      status: "ACTIVE",
      preferredLocale: "PT_BR",
      preferredTheme: "SYSTEM",
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
      fullName: "Usuário Operacional",
      passwordHash: adminPasswordHash,
      status: "ACTIVE",
      preferredLocale: "PT_BR",
      preferredTheme: "SYSTEM",
    },
    create: {
      fullName: "Usuário Operacional",
      email: "operacional@imobiliaria.local",
      passwordHash: adminPasswordHash,
      status: "ACTIVE",
      preferredLocale: "PT_BR",
      preferredTheme: "SYSTEM",
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

  await prisma.leaseTerminationRule.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {
      name: "Regra padrão de rescisão locatícia",
      penaltyPercentage: 10,
      proportionalByRemainingTime: true,
      allowManualAdjustments: true,
      additionalRulesJson: {
        defaultAdditionalCharges: [],
        defaultDiscounts: [],
        formula:
          "multa_base * proporcao_do_tempo_restante + adicionais - descontos",
      },
      standardNotes:
        "A memória de cálculo deve ser validada administrativamente antes da conclusão.",
      legalSupportText:
        "Esta simulação possui caráter operacional e não substitui revisão jurídica.",
      active: true,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Regra padrão de rescisão locatícia",
      penaltyPercentage: 10,
      proportionalByRemainingTime: true,
      allowManualAdjustments: true,
      additionalRulesJson: {
        defaultAdditionalCharges: [],
        defaultDiscounts: [],
        formula:
          "multa_base * proporcao_do_tempo_restante + adicionais - descontos",
      },
      standardNotes:
        "A memória de cálculo deve ser validada administrativamente antes da conclusão.",
      legalSupportText:
        "Esta simulação possui caráter operacional e não substitui revisão jurídica.",
      active: true,
    },
  });

  console.log("Seed concluído.");
  console.log(`Admin: ${adminEmail}`);
  console.log("Senha inicial definida pelo .env.");
  console.log("Usuário operacional: operacional@imobiliaria.local");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
