import type { Request, Response } from "express";
import { z } from "zod";
import { NotificationsService } from "./notifications.service";

const notificationsService = new NotificationsService();

const notificationsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

const notificationIdParamSchema = z.object({
  id: z.string().uuid("Identificador invalido."),
});

export class NotificationsController {
  async list(request: Request, response: Response) {
    const query = notificationsListQuerySchema.parse(request.query);
    const result = await notificationsService.listForUser(
      request.auth!.userId,
      query.limit,
    );
    return response.status(200).json(result);
  }

  async markAsRead(request: Request, response: Response) {
    const params = notificationIdParamSchema.parse(request.params);
    const result = await notificationsService.markAsRead(
      request.auth!.userId,
      params.id,
    );
    return response.status(200).json(result);
  }
}
