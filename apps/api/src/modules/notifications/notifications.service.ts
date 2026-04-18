import { prisma } from "../../core/prisma";
import { HttpError } from "../../core/http-error";
import { syncMaintenanceSlaNotifications } from "../maintenance/maintenance.notifications";

export class NotificationsService {
  async listForUser(userId: string, limit = 8) {
    await syncMaintenanceSlaNotifications({ userId });

    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
        take: limit,
      }),
      prisma.notification.count({
        where: {
          userId,
          readAt: null,
        },
      }),
    ]);

    return {
      unreadCount,
      items,
    };
  }

  async markAsRead(userId: string, id: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!notification || notification.userId !== userId) {
      throw new HttpError(404, "Notificacao nao encontrada.");
    }

    return prisma.notification.update({
      where: { id },
      data: {
        readAt: new Date(),
      },
    });
  }
}
