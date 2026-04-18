import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appRoutes } from "@imobiliaria/shared";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { useAuth } from "@/features/auth/auth-context";
import {
  LineItemsEditor,
  type MoneyLineItem,
} from "@/features/contracts/line-items-editor";
import { useI18n } from "@/features/preferences/language-provider";
import { buildDetailPath, formatCurrency, formatDate } from "@/lib/format";
import { contractsService } from "@/services/contracts-service";
import type {
  LeaseTerminationRule,
  LeaseTerminationSimulation,
} from "@/types/domain";

function getStorageKey(contractId: string) {
  return `imobiliaria.termination.${contractId}`;
}

function readRuleDefaults(rule?: LeaseTerminationRule | null) {
  if (!rule?.additionalRulesJson || typeof rule.additionalRulesJson !== "object") {
    return {
      additionalCharges: [] as MoneyLineItem[],
      discounts: [] as MoneyLineItem[],
    };
  }

  const rules = rule.additionalRulesJson as {
    defaultAdditionalCharges?: MoneyLineItem[];
    defaultDiscounts?: MoneyLineItem[];
  };

  return {
    additionalCharges: rules.defaultAdditionalCharges ?? [],
    discounts: rules.defaultDiscounts ?? [],
  };
}

export function ContractTerminationSimulationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { contractId = "" } = useParams();
  const { accessToken, hasPermission } = useAuth();
  const { t } = useI18n();
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [manualPenaltyPercentage, setManualPenaltyPercentage] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [additionalCharges, setAdditionalCharges] = useState<MoneyLineItem[]>([]);
  const [discounts, setDiscounts] = useState<MoneyLineItem[]>([]);
  const [simulation, setSimulation] = useState<LeaseTerminationSimulation | null>(
    null,
  );

  const contractQuery = useQuery({
    queryKey: ["contract-detail", contractId],
    queryFn: () => contractsService.getById(accessToken!, contractId),
    enabled: Boolean(accessToken && contractId),
  });

  const rulesQuery = useQuery({
    queryKey: ["termination-rules"],
    queryFn: () => contractsService.listTerminationRules(accessToken!),
    enabled: Boolean(accessToken),
  });

  const selectedRule = useMemo(
    () => rulesQuery.data?.find((rule) => rule.id === selectedRuleId) ?? null,
    [rulesQuery.data, selectedRuleId],
  );

  useEffect(() => {
    const activeRule =
      rulesQuery.data?.find((rule) => rule.active) ?? rulesQuery.data?.[0];

    if (!selectedRuleId && activeRule) {
      setSelectedRuleId(activeRule.id);
    }
  }, [rulesQuery.data, selectedRuleId]);

  useEffect(() => {
    const defaults = readRuleDefaults(selectedRule);
    setAdditionalCharges(defaults.additionalCharges);
    setDiscounts(defaults.discounts);
  }, [selectedRule]);

  const simulateMutation = useMutation({
    mutationFn: () =>
      contractsService.simulateTermination(accessToken!, contractId, {
        ruleId: selectedRuleId || null,
        manualPenaltyPercentage: manualPenaltyPercentage
          ? Number(manualPenaltyPercentage)
          : null,
        additionalCharges,
        discounts,
        reason: reason || null,
        notes: notes || null,
      }),
    onSuccess: async (result) => {
      setSimulation(result);
      window.sessionStorage.setItem(getStorageKey(contractId), JSON.stringify(result));
      toast.success(t("leaseTermination.simulationSaveSuccess"));
      await queryClient.invalidateQueries({
        queryKey: ["contract-detail", contractId],
      });
    },
  });

  const contract = contractQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("leaseTermination.eyebrow")}
        title={t("leaseTermination.simulationTitle")}
        description={t("leaseTermination.simulationDescription")}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <SectionCard title={t("leaseTermination.simulationParametersTitle")}>
          {contract ? (
            <div className="space-y-5">
              <div className="rounded-[24px] border border-ink-200 bg-[var(--elevated-bg)] px-5 py-5">
                <p className="font-semibold text-ink-950">{contract.code}</p>
                <p className="mt-1 text-sm text-ink-500">
                  {contract.property.code} · {contract.property.title}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  {t("tenantPortal.termLabel")}: {formatDate(contract.startDate)} até{" "}
                  {formatDate(contract.endDate)}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  {t("tenantPortal.rentLabel")}: {formatCurrency(contract.rentAmount)}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-ink-700">
                    {t("leaseTermination.ruleAppliedLabel")}
                  </span>
                  <select
                    value={selectedRuleId}
                    onChange={(event) => setSelectedRuleId(event.target.value)}
                    className="field-control"
                  >
                    {(rulesQuery.data ?? []).map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name}
                      </option>
                    ))}
                  </select>
                </label>
                <FormInput
                  label={t("leaseTermination.manualPenaltyLabel")}
                  type="number"
                  step="0.01"
                  value={manualPenaltyPercentage}
                  disabled={!selectedRule?.allowManualAdjustments}
                  onChange={(event) => setManualPenaltyPercentage(event.target.value)}
                />
                <div className="md:col-span-2">
                  <FormTextarea
                    label={t("leaseTermination.simulationReasonLabel")}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <FormTextarea
                    label={t("leaseTermination.simulationNotesLabel")}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <LineItemsEditor
                  title={t("leaseTermination.additionalChargesTitle")}
                  description={t("leaseTermination.additionalChargesDescription")}
                  items={additionalCharges}
                  onChange={setAdditionalCharges}
                />
                <LineItemsEditor
                  title={t("leaseTermination.discountsTitle")}
                  description={t("leaseTermination.discountsDescription")}
                  items={discounts}
                  onChange={setDiscounts}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                {hasPermission("leaseTermination.rules.manage") ? (
                  <button
                    type="button"
                    onClick={() => navigate(appRoutes.contractTerminationRules)}
                    className="secondary-button"
                  >
                    {t("leaseTermination.openRulesButton")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void simulateMutation.mutate()}
                  disabled={simulateMutation.isPending || !selectedRuleId}
                  className="primary-button"
                >
                  {simulateMutation.isPending
                    ? t("leaseTermination.calculatingButton")
                    : t("leaseTermination.generateSimulationButton")}
                </button>
              </div>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title={t("leaseTermination.memoryTitle")}>
          {simulation ? (
            <div className="space-y-4 text-sm text-ink-700">
              <div className="rounded-[24px] border border-brand-200 bg-brand-50 px-4 py-4">
                <p className="font-semibold text-ink-950">
                  {t("leaseTermination.estimatedFinalValue")}:{" "}
                  {formatCurrency(simulation.finalAmount)}
                </p>
                <p className="mt-1 text-ink-600">
                  {t("leaseTermination.remainingMonths")}: {simulation.remainingMonths}
                </p>
              </div>

              <div className="space-y-2 rounded-[24px] border border-ink-200 px-4 py-4">
                <p>
                  {t("leaseTermination.calculatedPenalty")}:{" "}
                  {formatCurrency(simulation.calculatedPenalty)}
                </p>
                <p>
                  {t("leaseTermination.additionalCharges")}:{" "}
                  {formatCurrency(simulation.additionalCharges)}
                </p>
                <p>
                  {t("leaseTermination.discounts")}:{" "}
                  {formatCurrency(simulation.discounts)}
                </p>
                <p className="font-semibold text-ink-950">
                  {t("leaseTermination.finalAmount")}:{" "}
                  {formatCurrency(simulation.finalAmount)}
                </p>
              </div>

              <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
                {simulation.summaryJson.legalWarning}
              </div>

              {hasPermission("leaseTermination.execute") ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `${buildDetailPath(appRoutes.contractTerminationConfirm, contractId)}?simulationId=${simulation.id}`,
                    )
                  }
                  className="primary-button w-full"
                >
                  {t("leaseTermination.proceedToConfirmation")}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-ink-200 px-4 py-8 text-sm text-ink-500">
              {t("leaseTermination.emptyMemory")}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title={t("leaseTermination.importantNoticeTitle")}>
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          {t("leaseTermination.legalWarning")}
        </div>
      </SectionCard>
    </div>
  );
}
