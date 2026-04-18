import {
  AuditEntityType,
  MaintenanceTicketStatus,
  NotificationType,
  UserStatus,
} from "@prisma/client";
import { prisma } from "../../core/prisma";
import { roleCodes } from "@imobiliaria/shared";
import {
  getMaintenanceStatusLabel,
  getMaintenanceTypeLabel,
  getMaintenanceUrgencyLabel,
  getNotificationSeverityForUrgency,
  getOpenDays,
  isMaintenanceTerminalStatus,
  resolveSlaDueDate,
} from "./maintenance.rules";

type SyncOptions = {
  ticketIds?: string[];
  userId?: string;
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfTomorrow() {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}

export async function syncMaintenanceSlaNotifications(
  options: SyncOptions = {},
) {
  const today = startOfToday();
  const tomorrow = startOfTomorrow();

  const [masterUsers, tickets] = await Promise.all([
    prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        roles: {
          some: {
            role: {
              code: roleCodes.MASTER_ADMIN,
            },
          },
        },
      },
      select: {
        id: true,
      },
    }),
    prisma.maintenanceTicket.findMany({
      where: {
        ...(options.ticketIds?.length
          ? {
              id: {
                in: options.ticketIds,
              },
            }
          : {}),
      },
      select: {
        id: true,
        ticketId: true,
        title: true,
        type: true,
        urgencyLevel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        propertyTitleSnapshot: true,
        propertyCodeSnapshot: true,
        openedByUserId: true,
      },
    }),
  ]);

  const masterUserIds = masterUsers.map((user) => user.id);
  const existingNotifications = await prisma.notification.findMany({
    where: {
      type: NotificationType.MAINTENANCE_SLA,
      entityType: AuditEntityType.MAINTENANCE_TICKET,
      scheduledFor: {
        gte: today,
        lt: tomorrow,
      },
      ...(options.ticketIds?.length
        ? {
            entityId: {
              in: options.ticketIds,
            },
          }
        : {}),
    },
    select: {
      userId: true,
      entityId: true,
    },
  });

  const existingKeys = new Set(
    existingNotifications.map((item) => `${item.userId}:${item.entityId}`),
  );

  const notificationsToCreate = [];

  for (const ticket of tickets) {
    if (isMaintenanceTerminalStatus(ticket.status)) {
      continue;
    }

    const dueDate = resolveSlaDueDate(ticket.createdAt, ticket.urgencyLevel);
    if (dueDate > today) {
      continue;
    }

    const recipientIds = Array.from(
      new Set([ticket.openedByUserId, ...masterUserIds]),
    ).filter((userId) => (options.userId ? userId === options.userId : true));

    const daysOpen = getOpenDays(ticket.createdAt);
    const typeLabel = getMaintenanceTypeLabel(ticket.type);
    const statusLabel = getMaintenanceStatusLabel(ticket.status);
    const urgencyLabel = getMaintenanceUrgencyLabel(ticket.urgencyLevel);
    const isInProgress =
      ticket.status !== MaintenanceTicketStatus.OPEN &&
      ticket.status !== MaintenanceTicketStatus.TRIAGE;

    for (const userId of recipientIds) {
      const notificationKey = `${userId}:${ticket.id}`;
      if (existingKeys.has(notificationKey)) {
        continue;
      }

      notificationsToCreate.push({
        userId,
        type: NotificationType.MAINTENANCE_SLA,
        severity: getNotificationSeverityForUrgency(ticket.urgencyLevel),
        title: isInProgress
          ? `Chamado ${ticket.ticketId} segue em aberto`
          : `Chamado ${ticket.ticketId} exige acompanhamento`,
        message: `${ticket.ticketId} | ${ticket.propertyCodeSnapshot} - ${ticket.propertyTitleSnapshot} | Tipo: ${typeLabel} | Urgencia: ${urgencyLabel} | Status: ${statusLabel} | Tempo em aberto: ${daysOpen} dia(s).`,
        entityType: AuditEntityType.MAINTENANCE_TICKET,
        entityId: ticket.id,
        scheduledFor: today,
        sentAt: new Date(),
      });
    }
  }

  if (notificationsToCreate.length > 0) {
    await prisma.notification.createMany({
      data: notificationsToCreate,
    });
  }
}
