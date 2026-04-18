import { AuditEntityType } from "@prisma/client";
import { prisma } from "./prisma";

type AuditInput = {
  actorUserId?: string | null;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  description: string;
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
};

export async function createAuditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      description: input.description,
      metadata: input.metadata as object | undefined,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

