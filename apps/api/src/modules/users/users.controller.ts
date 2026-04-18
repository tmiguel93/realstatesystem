import type { Request, Response } from "express";
import {
  userIdParamSchema,
  userPayloadSchema,
  userResetPasswordSchema,
  rolePermissionUpdateSchema,
  userStatusPayloadSchema,
  usersListQuerySchema,
  userUpdatePayloadSchema,
} from "./users.schemas";
import { UsersService } from "./users.service";
import { getRequestContext } from "../../shared/http/request-context";

const usersService = new UsersService();

export class UsersController {
  async list(request: Request, response: Response) {
    const query = usersListQuerySchema.parse(request.query);
    const result = await usersService.list(query);
    return response.status(200).json(result);
  }

  async getById(request: Request, response: Response) {
    const params = userIdParamSchema.parse(request.params);
    const result = await usersService.getById(params.id);
    return response.status(200).json(result);
  }

  async create(request: Request, response: Response) {
    const payload = userPayloadSchema.parse(request.body);
    const result = await usersService.create(payload, getRequestContext(request));
    return response.status(201).json(result);
  }

  async update(request: Request, response: Response) {
    const params = userIdParamSchema.parse(request.params);
    const payload = userUpdatePayloadSchema.parse(request.body);
    const result = await usersService.update(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async updateStatus(request: Request, response: Response) {
    const params = userIdParamSchema.parse(request.params);
    const payload = userStatusPayloadSchema.parse(request.body);
    const result = await usersService.updateStatus(
      params.id,
      payload.status,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async resetPassword(request: Request, response: Response) {
    const params = userIdParamSchema.parse(request.params);
    const payload = userResetPasswordSchema.parse(request.body);
    const result = await usersService.resetPassword(
      params.id,
      payload.newPassword,
      payload.mustChangePassword,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async listRoles(_request: Request, response: Response) {
    const result = await usersService.listRoles();
    return response.status(200).json(result);
  }

  async listPermissions(_request: Request, response: Response) {
    const result = await usersService.listPermissions();
    return response.status(200).json(result);
  }

  async updateRolePermissions(request: Request, response: Response) {
    const params = userIdParamSchema.parse(request.params);
    const payload = rolePermissionUpdateSchema.parse(request.body);
    const result = await usersService.updateRolePermissions(
      params.id,
      payload.permissionCodes,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async listAssignable(_request: Request, response: Response) {
    const result = await usersService.listAssignable();
    return response.status(200).json(result);
  }
}
