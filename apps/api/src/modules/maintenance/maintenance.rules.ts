import {
  MaintenanceTriageDecision,
  MaintenanceTicketStatus,
  MaintenanceTicketType,
  NotificationSeverity,
} from "@prisma/client";
import {
  maintenanceTriageDecisionOptions,
  maintenanceTicketStatusOptions,
  maintenanceTicketTypeOptions,
} from "@imobiliaria/shared";

const urgencyByType: Record<MaintenanceTicketType, number> = {
  STRUCTURAL: 5,
  INTERNAL: 3,
  EXTERNAL: 3,
  HYDRAULIC: 4,
  ELECTRICAL: 5,
  ROOFING: 4,
  LEAKAGE: 5,
  SEWAGE: 5,
  PAINTING: 2,
  DOORS_WINDOWS: 4,
  LOCKS_SECURITY: 4,
  HVAC: 4,
  GAS: 5,
  PEST_CONTROL: 3,
  LANDSCAPING: 2,
  TECHNICAL_CLEANING: 2,
  EQUIPMENT: 3,
  FIXED_FURNITURE: 2,
  PREVENTIVE: 1,
  CORRECTIVE: 3,
  EMERGENCY: 5,
  CONDOMINIUM: 3,
  OTHER: 1,
};

const slaDaysByUrgency: Record<number, number> = {
  1: 5,
  2: 4,
  3: 3,
  4: 2,
  5: 1,
};

export const maintenanceTerminalStatuses = [
  MaintenanceTicketStatus.FINISHED,
  MaintenanceTicketStatus.CANCELLED,
] as const;

export function resolveUrgencyForMaintenanceType(type: MaintenanceTicketType) {
  return urgencyByType[type];
}

export function resolveSlaDaysForUrgency(urgencyLevel: number) {
  return slaDaysByUrgency[urgencyLevel] ?? 5;
}

export function resolveSlaDueDate(
  createdAt: Date,
  urgencyLevel: number,
) {
  const dueDate = new Date(createdAt);
  dueDate.setDate(
    dueDate.getDate() + resolveSlaDaysForUrgency(urgencyLevel),
  );
  return dueDate;
}

export function isMaintenanceTerminalStatus(status: MaintenanceTicketStatus) {
  return (
    status === MaintenanceTicketStatus.FINISHED ||
    status === MaintenanceTicketStatus.CANCELLED
  );
}

export function getMaintenanceTypeLabel(type: MaintenanceTicketType | string) {
  return (
    maintenanceTicketTypeOptions.find((item) => item.value === type)?.label ??
    type
  );
}

export function getMaintenanceStatusLabel(
  status: MaintenanceTicketStatus | string,
) {
  return (
    maintenanceTicketStatusOptions.find((item) => item.value === status)
      ?.label ?? status
  );
}

export function getMaintenanceTriageDecisionLabel(
  decision: MaintenanceTriageDecision | string | null | undefined,
) {
  if (!decision) {
    return "Não classificado";
  }

  return (
    maintenanceTriageDecisionOptions.find((item) => item.value === decision)
      ?.label ?? decision
  );
}

export function getMaintenanceUrgencyLabel(urgencyLevel: number) {
  return `${urgencyLevel} - ${
    {
      1: "Baixa",
      2: "Moderada",
      3: "Alta",
      4: "Muito alta",
      5: "Urgentíssimo",
    }[urgencyLevel] ?? "Não classificada"
  }`;
}

export function getNotificationSeverityForUrgency(
  urgencyLevel: number,
): NotificationSeverity {
  if (urgencyLevel >= 5) {
    return NotificationSeverity.CRITICAL;
  }

  if (urgencyLevel >= 3) {
    return NotificationSeverity.WARNING;
  }

  return NotificationSeverity.INFO;
}

export function getOpenDays(createdAt: Date, referenceDate = new Date()) {
  const diffMs = referenceDate.getTime() - createdAt.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function getDaysSinceLastUpdate(
  updatedAt: Date,
  referenceDate = new Date(),
) {
  const diffMs = referenceDate.getTime() - updatedAt.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}
