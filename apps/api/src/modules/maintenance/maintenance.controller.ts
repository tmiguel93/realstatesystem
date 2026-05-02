import type { Request, Response } from "express";
import { getRequestContext } from "../../shared/http/request-context";
import { MaintenanceService } from "./maintenance.service";
import {
  maintenancePropertyContextQuerySchema,
  maintenanceTicketCreateSchema,
  maintenanceTicketIdParamSchema,
  maintenanceTicketsListQuerySchema,
  maintenanceTicketStatusSchema,
  maintenanceTicketTriageSchema,
  maintenanceTicketUpdateSchema,
} from "./maintenance.schemas";

const maintenanceService = new MaintenanceService();

export class MaintenanceController {
  async list(request: Request, response: Response) {
    const query = maintenanceTicketsListQuerySchema.parse(request.query);
    const result = await maintenanceService.list(
      query,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async dashboard(request: Request, response: Response) {
    const result = await maintenanceService.getDashboard(
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async kanban(request: Request, response: Response) {
    const query = maintenanceTicketsListQuerySchema.parse(request.query);
    const result = await maintenanceService.getKanban(
      query,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async getById(request: Request, response: Response) {
    const params = maintenanceTicketIdParamSchema.parse(request.params);
    const result = await maintenanceService.getById(
      params.id,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async getHistory(request: Request, response: Response) {
    const params = maintenanceTicketIdParamSchema.parse(request.params);
    const result = await maintenanceService.getHistory(
      params.id,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async getPropertyContext(request: Request, response: Response) {
    const query = maintenancePropertyContextQuerySchema.parse(request.query);
    const result = await maintenanceService.getPropertyContext(
      query,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async create(request: Request, response: Response) {
    const payload = maintenanceTicketCreateSchema.parse(request.body);
    const result = await maintenanceService.create(
      payload,
      getRequestContext(request),
    );
    return response.status(201).json(result);
  }

  async update(request: Request, response: Response) {
    const params = maintenanceTicketIdParamSchema.parse(request.params);
    const payload = maintenanceTicketUpdateSchema.parse(request.body);
    const result = await maintenanceService.update(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async updateStatus(request: Request, response: Response) {
    const params = maintenanceTicketIdParamSchema.parse(request.params);
    const payload = maintenanceTicketStatusSchema.parse(request.body);
    const result = await maintenanceService.updateStatus(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async triage(request: Request, response: Response) {
    const params = maintenanceTicketIdParamSchema.parse(request.params);
    const payload = maintenanceTicketTriageSchema.parse(request.body);
    const result = await maintenanceService.triage(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }
}
