import {
  AuditEntityType,
  ContractStatus,
  Prisma,
  PropertyPurpose,
  PropertyStatus,
} from "@prisma/client";
import { createAuditLog } from "../../core/audit";
import { HttpError } from "../../core/http-error";
import { prisma } from "../../core/prisma";
import { rethrowPrismaError } from "../../core/prisma-error";
import type {
  LeaseTerminationConfirmPayloadInput,
  LeaseTerminationRulePayloadInput,
  LeaseTerminationSimulationPayloadInput,
} from "./contracts.schemas";

type RequestContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

type MoneyLineItem = {
  label: string;
  amount: number;
};

function normalizeOptionalString(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function diffInDays(start: Date, end: Date) {
  return Math.max(
    0,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function sumLineItems(items: MoneyLineItem[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

export class ContractTerminationService {
  async listRules() {
    const rules = await prisma.leaseTerminationRule.findMany({
      orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
    });

    return rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      penaltyPercentage: Number(rule.penaltyPercentage),
      proportionalByRemainingTime: rule.proportionalByRemainingTime,
      allowManualAdjustments: rule.allowManualAdjustments,
      additionalRulesJson: rule.additionalRulesJson,
      standardNotes: rule.standardNotes,
      legalSupportText: rule.legalSupportText,
      active: rule.active,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    }));
  }

  async saveRule(
    payload: LeaseTerminationRulePayloadInput,
    context: RequestContext,
  ) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessão inválida para parametrizar a rescisão.");
    }

    const additionalRulesJson = {
      formulaDescription: payload.formulaDescription,
      defaultAdditionalCharges: payload.additionalCharges,
      defaultDiscounts: payload.discounts,
    };

    const rule = await prisma.$transaction(async (tx) => {
      if (payload.active) {
        await tx.leaseTerminationRule.updateMany({
          where: {
            active: true,
            ...(payload.id ? { id: { not: payload.id } } : {}),
          },
          data: {
            active: false,
          },
        });
      }

      if (payload.id) {
        return tx.leaseTerminationRule.update({
          where: { id: payload.id },
          data: {
            name: payload.name.trim(),
            penaltyPercentage: payload.penaltyPercentage,
            proportionalByRemainingTime: payload.proportionalByRemainingTime,
            allowManualAdjustments: payload.allowManualAdjustments,
            additionalRulesJson,
            standardNotes: normalizeOptionalString(payload.standardNotes),
            legalSupportText: normalizeOptionalString(payload.legalSupportText),
            active: payload.active,
          },
        });
      }

      return tx.leaseTerminationRule.create({
        data: {
          name: payload.name.trim(),
          penaltyPercentage: payload.penaltyPercentage,
          proportionalByRemainingTime: payload.proportionalByRemainingTime,
          allowManualAdjustments: payload.allowManualAdjustments,
          additionalRulesJson,
          standardNotes: normalizeOptionalString(payload.standardNotes),
          legalSupportText: normalizeOptionalString(payload.legalSupportText),
          active: payload.active,
        },
      });
    });

    await createAuditLog({
      actorUserId: context.actorUserId,
      action: "contracts.termination-rule.save",
      entityType: AuditEntityType.LEASE_TERMINATION_RULE,
      entityId: rule.id,
      description: `Regra de rescisão ${rule.name} foi parametrizada.`,
      metadata: payload,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return this.listRules();
  }

  async simulate(
    contractId: string,
    payload: LeaseTerminationSimulationPayloadInput,
    context: RequestContext,
  ) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessão inválida para simular a rescisão.");
    }

    const [contract, rule] = await Promise.all([
      prisma.contract.findUnique({
        where: { id: contractId },
        select: {
          id: true,
          code: true,
          status: true,
          startDate: true,
          endDate: true,
          rentAmount: true,
          propertyId: true,
          property: {
            select: {
              code: true,
              title: true,
              purpose: true,
            },
          },
          tenant: {
            select: {
              fullName: true,
            },
          },
        },
      }),
      payload.ruleId
        ? prisma.leaseTerminationRule.findUnique({
            where: { id: payload.ruleId },
          })
        : prisma.leaseTerminationRule.findFirst({
            where: { active: true },
          }),
    ]);

    if (!contract) {
      throw new HttpError(404, "Contrato não encontrado.");
    }

    if (!rule) {
      throw new HttpError(
        404,
        "Nenhuma regra de rescisão ativa foi encontrada para a simulação.",
      );
    }

    const eligibleStatuses: ContractStatus[] = [
      ContractStatus.ACTIVE,
      ContractStatus.RENEWED,
      ContractStatus.PENDING_SIGNATURE,
    ];

    if (!eligibleStatuses.includes(contract.status)) {
      throw new HttpError(
        409,
        "Somente contratos ativos, renovados ou em assinatura podem ser simulados.",
      );
    }

    if (
      payload.manualPenaltyPercentage !== null &&
      payload.manualPenaltyPercentage !== undefined &&
      !rule.allowManualAdjustments
    ) {
      throw new HttpError(
        422,
        "A regra selecionada não permite ajuste manual do percentual.",
      );
    }

    const now = new Date();
    const contractValue = Number(contract.rentAmount);
    const totalDays = Math.max(1, diffInDays(contract.startDate, contract.endDate));
    const remainingDays = diffInDays(now, contract.endDate);
    const remainingMonths = Number((remainingDays / 30).toFixed(1));
    const penaltyPercentage =
      payload.manualPenaltyPercentage ?? Number(rule.penaltyPercentage);
    const proportionalFactor = rule.proportionalByRemainingTime
      ? Number((remainingDays / totalDays).toFixed(4))
      : 1;
    const basePenalty = contractValue * (penaltyPercentage / 100);
    const calculatedPenalty = Number(
      (basePenalty * proportionalFactor).toFixed(2),
    );
    const additionalChargesTotal = Number(
      sumLineItems(payload.additionalCharges).toFixed(2),
    );
    const discountsTotal = Number(sumLineItems(payload.discounts).toFixed(2));
    const finalAmount = Number(
      (calculatedPenalty + additionalChargesTotal - discountsTotal).toFixed(2),
    );
    const summaryJson = {
      contractCode: contract.code,
      property: `${contract.property.code} - ${contract.property.title}`,
      tenantName: contract.tenant.fullName,
      reason: normalizeOptionalString(payload.reason),
      notes: normalizeOptionalString(payload.notes),
      legalWarning:
        "Simulação operacional sujeita à revisão administrativa e jurídica antes da conclusão.",
      calculationMemory: {
        contractValue,
        totalDays,
        remainingDays,
        remainingMonths,
        penaltyPercentage,
        proportionalByRemainingTime: rule.proportionalByRemainingTime,
        proportionalFactor,
        basePenalty: Number(basePenalty.toFixed(2)),
        calculatedPenalty,
        additionalCharges: payload.additionalCharges,
        additionalChargesTotal,
        discounts: payload.discounts,
        discountsTotal,
        finalAmount,
      },
      ruleSnapshot: {
        id: rule.id,
        name: rule.name,
        standardNotes: rule.standardNotes,
        legalSupportText: rule.legalSupportText,
        allowManualAdjustments: rule.allowManualAdjustments,
      },
    };

    try {
      const simulation = await prisma.leaseTerminationSimulation.create({
        data: {
          contractId,
          ruleId: rule.id,
          remainingMonths: Math.ceil(remainingMonths),
          contractValue,
          penaltyPercentage,
          calculatedPenalty,
          additionalCharges: additionalChargesTotal,
          discounts: discountsTotal,
          finalAmount,
          summaryJson,
          notes: normalizeOptionalString(payload.notes),
          createdByUserId: context.actorUserId,
        },
      });

      await createAuditLog({
        actorUserId: context.actorUserId,
        action: "contracts.termination.simulate",
        entityType: AuditEntityType.LEASE_TERMINATION_SIMULATION,
        entityId: simulation.id,
        description: `Simulação de baixa criada para o contrato ${contract.code}.`,
        metadata: summaryJson,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return {
        id: simulation.id,
        contractId,
        ruleId: rule.id,
        remainingMonths: simulation.remainingMonths,
        contractValue,
        penaltyPercentage,
        calculatedPenalty,
        additionalCharges: additionalChargesTotal,
        discounts: discountsTotal,
        finalAmount,
        summaryJson,
        notes: simulation.notes,
        createdAt: simulation.createdAt,
      };
    } catch (error) {
      rethrowPrismaError(error, "Falha ao gerar a simulação de rescisão.");
    }
  }

  async confirm(
    contractId: string,
    payload: LeaseTerminationConfirmPayloadInput,
    context: RequestContext,
  ) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Sessão inválida para concluir a baixa.");
    }

    const simulation = await prisma.leaseTerminationSimulation.findUnique({
      where: { id: payload.simulationId },
      include: {
        rule: true,
        contract: {
          select: {
            id: true,
            code: true,
            status: true,
            propertyId: true,
            property: {
              select: {
                purpose: true,
              },
            },
          },
        },
      },
    });

    if (!simulation || simulation.contractId !== contractId) {
      throw new HttpError(404, "Simulação de rescisão não encontrada.");
    }

    const eligibleStatuses: ContractStatus[] = [
      ContractStatus.ACTIVE,
      ContractStatus.RENEWED,
      ContractStatus.PENDING_SIGNATURE,
    ];

    if (!eligibleStatuses.includes(simulation.contract.status)) {
      throw new HttpError(409, "Este contrato não pode mais ser encerrado.");
    }

    const terminatedAt = new Date();

    try {
      const contract = await prisma.$transaction(async (tx) => {
        await tx.contract.update({
          where: { id: contractId },
          data: {
            status: ContractStatus.TERMINATED,
            terminatedAt,
            terminatedByUserId: context.actorUserId,
            leaseTerminationRuleId: simulation.ruleId,
            terminationReason: payload.reason.trim(),
            terminationCalculation: {
              simulationId: simulation.id,
              confirmedAt: terminatedAt,
              finalNotes: normalizeOptionalString(payload.finalNotes),
              summaryJson: simulation.summaryJson,
            },
          },
        });

        await tx.leaseTerminationSimulation.update({
          where: { id: simulation.id },
          data: {
            confirmedAt: terminatedAt,
            confirmedByUserId: context.actorUserId,
            notes: normalizeOptionalString(payload.finalNotes) ?? simulation.notes,
          },
        });

        await this.reopenPropertyIfAvailable(
          tx,
          simulation.contract.propertyId,
          simulation.contract.id,
          simulation.contract.property.purpose,
        );

        return tx.contract.findUniqueOrThrow({
          where: { id: contractId },
          select: {
            id: true,
            code: true,
            status: true,
            terminatedAt: true,
            terminationReason: true,
            terminationCalculation: true,
          },
        });
      });

      await createAuditLog({
        actorUserId: context.actorUserId,
        action: "contracts.termination.confirm",
        entityType: AuditEntityType.CONTRACT,
        entityId: contractId,
        description: `Contrato ${simulation.contract.code} encerrado com base na simulação de rescisão.`,
        metadata: {
          simulationId: simulation.id,
          ruleId: simulation.ruleId,
          reason: payload.reason,
          finalNotes: payload.finalNotes ?? null,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return contract;
    } catch (error) {
      rethrowPrismaError(error, "Falha ao concluir a baixa contratual.");
    }
  }

  private async reopenPropertyIfAvailable(
    tx: Prisma.TransactionClient,
    propertyId: string,
    currentContractId: string,
    purpose: PropertyPurpose,
  ) {
    const activeSibling = await tx.contract.count({
      where: {
        id: { not: currentContractId },
        propertyId,
        status: {
          in: [
            ContractStatus.DRAFT,
            ContractStatus.UNDER_REVIEW,
            ContractStatus.PENDING_SIGNATURE,
            ContractStatus.ACTIVE,
          ],
        },
      },
    });

    if (activeSibling > 0) {
      return;
    }

    await tx.property.update({
      where: { id: propertyId },
      data: {
        status: PropertyStatus.AVAILABLE,
        commercialSituation:
          purpose === PropertyPurpose.RENT
            ? "AVAILABLE_FOR_RENT"
            : purpose === PropertyPurpose.BOTH
              ? "AVAILABLE_FOR_BOTH"
              : "AVAILABLE_FOR_SALE",
      },
    });
  }
}
