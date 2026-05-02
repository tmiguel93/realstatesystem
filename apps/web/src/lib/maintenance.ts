import {
  maintenanceTriageDecisionOptions,
  maintenanceTicketStatusOptions,
  maintenanceTicketTypeOptions,
  maintenanceUrgencyOptions,
} from "@imobiliaria/shared";

export function getMaintenanceTypeLabel(type: string) {
  return (
    maintenanceTicketTypeOptions.find((item) => item.value === type)?.label ??
    type
  );
}

export function getMaintenanceStatusLabel(status: string) {
  return (
    maintenanceTicketStatusOptions.find((item) => item.value === status)?.label ??
    status
  );
}

export function getMaintenanceUrgencyLabel(urgencyLevel: number) {
  return (
    maintenanceUrgencyOptions.find(
      (item) => Number(item.value) === Number(urgencyLevel),
    )?.label ?? `${urgencyLevel}`
  );
}

export function getMaintenanceTriageDecisionLabel(decision?: string | null) {
  if (!decision) {
    return "Não classificado";
  }

  return (
    maintenanceTriageDecisionOptions.find((item) => item.value === decision)
      ?.label ?? decision
  );
}

export function getMaintenanceTriageTone(decision?: string | null) {
  switch (decision) {
    case "EMERGENCY":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "NEEDS_QUOTE":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "INTERNAL_REPAIR":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-ink-200 bg-white text-ink-600";
  }
}

export function getMaintenanceUrgencyTone(urgencyLevel: number) {
  switch (urgencyLevel) {
    case 5:
      return "bg-rose-600 text-white border-rose-600";
    case 4:
      return "bg-orange-100 text-orange-800 border-orange-200";
    case 3:
      return "bg-amber-100 text-amber-800 border-amber-200";
    case 2:
      return "bg-sky-100 text-sky-800 border-sky-200";
    default:
      return "bg-ink-100 text-ink-700 border-ink-200";
  }
}

export function resolveSuggestedUrgency(type: string) {
  const urgencyByType: Record<string, number> = {
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

  return urgencyByType[type] ?? 1;
}

export function resolveSuggestedTriageDecision(type: string) {
  const urgency = resolveSuggestedUrgency(type);

  if (urgency >= 5 || ["EMERGENCY", "GAS", "ELECTRICAL"].includes(type)) {
    return "EMERGENCY";
  }

  if (
    [
      "HYDRAULIC",
      "STRUCTURAL",
      "ROOFING",
      "LEAKAGE",
      "SEWAGE",
      "LOCKS_SECURITY",
      "HVAC",
      "EQUIPMENT",
      "CONDOMINIUM",
    ].includes(type)
  ) {
    return "NEEDS_QUOTE";
  }

  return "INTERNAL_REPAIR";
}

export function requiresMaintenanceEvidence(type: string) {
  return [
    "STRUCTURAL",
    "EXTERNAL",
    "ROOFING",
    "LEAKAGE",
    "PAINTING",
    "DOORS_WINDOWS",
    "PEST_CONTROL",
    "LANDSCAPING",
    "EQUIPMENT",
    "FIXED_FURNITURE",
    "CONDOMINIUM",
    "OTHER",
  ].includes(type);
}

export function formatOpenDuration(openDays: number) {
  if (openDays <= 0) {
    return "Hoje";
  }

  if (openDays === 1) {
    return "1 dia";
  }

  return `${openDays} dias`;
}
