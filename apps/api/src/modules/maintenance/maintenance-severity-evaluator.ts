import {
  MaintenanceSeveritySourceType,
  MaintenanceTicketType,
} from "@prisma/client";

export type MaintenanceSeverityInput = {
  type: MaintenanceTicketType;
  description: string;
  attachmentCount: number;
};

export type MaintenanceSeverityResult = {
  score: number;
  justification: string;
  sourceType: MaintenanceSeveritySourceType;
};

export interface MaintenanceSeverityAdapter {
  evaluate(input: MaintenanceSeverityInput): Promise<MaintenanceSeverityResult>;
}

const baseScoreByType: Record<MaintenanceTicketType, number> = {
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
  OTHER: 1,
};

const visualEvidenceRequiredTypes = new Set<MaintenanceTicketType>([
  MaintenanceTicketType.STRUCTURAL,
  MaintenanceTicketType.EXTERNAL,
  MaintenanceTicketType.ROOFING,
  MaintenanceTicketType.LEAKAGE,
  MaintenanceTicketType.PAINTING,
  MaintenanceTicketType.DOORS_WINDOWS,
  MaintenanceTicketType.PEST_CONTROL,
  MaintenanceTicketType.LANDSCAPING,
  MaintenanceTicketType.EQUIPMENT,
  MaintenanceTicketType.FIXED_FURNITURE,
  MaintenanceTicketType.OTHER,
]);

const criticalKeywords = [
  "risco",
  "choque",
  "curto",
  "fogo",
  "incêndio",
  "gas",
  "gás",
  "desabamento",
  "grave",
  "alagamento",
  "vazando muito",
  "sem energia",
  "sem água",
];

const highAttentionKeywords = [
  "urgente",
  "vazamento",
  "infiltração",
  "infiltracao",
  "quebrado",
  "trancado",
  "travado",
  "porta",
  "janela",
  "mofado",
  "odor",
  "esgoto",
];

class RuleBasedMaintenanceSeverityAdapter
  implements MaintenanceSeverityAdapter
{
  async evaluate(
    input: MaintenanceSeverityInput,
  ): Promise<MaintenanceSeverityResult> {
    const normalizedDescription = input.description.trim().toLowerCase();
    let score = baseScoreByType[input.type] ?? 1;
    const reasons = [`Tipo ${input.type} classificado pela régua interna.`];

    if (
      criticalKeywords.some((keyword) => normalizedDescription.includes(keyword))
    ) {
      score = Math.max(score, 5);
      reasons.push("Descrição sugere risco relevante ou impacto imediato.");
    } else if (
      highAttentionKeywords.some((keyword) =>
        normalizedDescription.includes(keyword),
      )
    ) {
      score = Math.max(score, 4);
      reasons.push("Descrição indica impacto operacional ou funcional elevado.");
    }

    if (input.attachmentCount > 0) {
      reasons.push(
        `${input.attachmentCount} evidência(s) visual(is) anexada(s) ao chamado.`,
      );
    } else if (requiresVisualEvidence(input.type)) {
      reasons.push(
        "O tipo selecionado costuma exigir evidência visual; mantenha revisão operacional atenta.",
      );
    }

    return {
      score: Math.min(5, Math.max(1, score)),
      justification: reasons.join(" "),
      sourceType: MaintenanceSeveritySourceType.RULE,
    };
  }
}

export function requiresVisualEvidence(type: MaintenanceTicketType) {
  return visualEvidenceRequiredTypes.has(type);
}

export const maintenanceSeverityEvaluator: MaintenanceSeverityAdapter =
  new RuleBasedMaintenanceSeverityAdapter();
