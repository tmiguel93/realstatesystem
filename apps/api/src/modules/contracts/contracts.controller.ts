import type { Request, Response } from "express";
import {
  contractIdParamSchema,
  leaseTerminationConfirmPayloadSchema,
  leaseTerminationRulePayloadSchema,
  leaseTerminationSimulationPayloadSchema,
  contractPayloadSchema,
  contractReviewPayloadSchema,
  contractsListQuerySchema,
  contractStatusPayloadSchema,
  contractVersionParamsSchema,
} from "./contracts.schemas";
import { ContractsService } from "./contracts.service";
import { getRequestContext } from "../../shared/http/request-context";
import { ContractTerminationService } from "./contracts-termination.service";

const contractsService = new ContractsService();
const contractTerminationService = new ContractTerminationService();

export class ContractsController {
  async list(request: Request, response: Response) {
    const query = contractsListQuerySchema.parse(request.query);
    const result = await contractsService.list(query);
    return response.status(200).json(result);
  }

  async getById(request: Request, response: Response) {
    const params = contractIdParamSchema.parse(request.params);
    const result = await contractsService.getById(params.id);
    return response.status(200).json(result);
  }

  async create(request: Request, response: Response) {
    const payload = contractPayloadSchema.parse(request.body);
    const result = await contractsService.create(
      payload,
      getRequestContext(request),
    );
    return response.status(201).json(result);
  }

  async createVersion(request: Request, response: Response) {
    const params = contractIdParamSchema.parse(request.params);
    const payload = contractPayloadSchema.parse(request.body);
    const result = await contractsService.createVersion(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(201).json(result);
  }

  async reviewVersion(request: Request, response: Response) {
    const params = contractVersionParamsSchema.parse(request.params);
    const payload = contractReviewPayloadSchema.parse(request.body);
    const result = await contractsService.reviewVersion(
      params.id,
      params.versionId,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async updateStatus(request: Request, response: Response) {
    const params = contractIdParamSchema.parse(request.params);
    const payload = contractStatusPayloadSchema.parse(request.body);
    const result = await contractsService.updateStatus(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async downloadPdf(request: Request, response: Response) {
    const params = contractVersionParamsSchema.parse(request.params);
    const result = await contractsService.generatePdf(
      params.id,
      params.versionId,
    );
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.fileName}"`,
    );
    return response.status(200).send(result.buffer);
  }

  async listTerminationRules(_request: Request, response: Response) {
    const result = await contractTerminationService.listRules();
    return response.status(200).json(result);
  }

  async saveTerminationRule(request: Request, response: Response) {
    const payload = leaseTerminationRulePayloadSchema.parse(request.body);
    const result = await contractTerminationService.saveRule(
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }

  async simulateTermination(request: Request, response: Response) {
    const params = contractIdParamSchema.parse(request.params);
    const payload = leaseTerminationSimulationPayloadSchema.parse(request.body);
    const result = await contractTerminationService.simulate(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(201).json(result);
  }

  async confirmTermination(request: Request, response: Response) {
    const params = contractIdParamSchema.parse(request.params);
    const payload = leaseTerminationConfirmPayloadSchema.parse(request.body);
    const result = await contractTerminationService.confirm(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }
}
