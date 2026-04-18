import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { FormInput } from "@/components/form/form-input";
import { FormSwitch } from "@/components/form/form-switch";
import { FormTextarea } from "@/components/form/form-textarea";
import { useAuth } from "@/features/auth/auth-context";
import {
  LineItemsEditor,
  type MoneyLineItem,
} from "@/features/contracts/line-items-editor";
import { useI18n } from "@/features/preferences/language-provider";
import { contractsService } from "@/services/contracts-service";
import type { LeaseTerminationRule } from "@/types/domain";

type RuleFormState = {
  id?: string;
  name: string;
  penaltyPercentage: number;
  proportionalByRemainingTime: boolean;
  allowManualAdjustments: boolean;
  formulaDescription: string;
  standardNotes: string;
  legalSupportText: string;
  active: boolean;
  additionalCharges: MoneyLineItem[];
  discounts: MoneyLineItem[];
};

function parseRuleToForm(
  fallbackFormula: string,
  rule?: LeaseTerminationRule | null,
): RuleFormState {
  const additionalRules =
    rule?.additionalRulesJson && typeof rule.additionalRulesJson === "object"
      ? (rule.additionalRulesJson as {
          formulaDescription?: string;
          defaultAdditionalCharges?: MoneyLineItem[];
          defaultDiscounts?: MoneyLineItem[];
        })
      : null;

  return {
    id: rule?.id,
    name: rule?.name ?? "",
    penaltyPercentage: rule?.penaltyPercentage ?? 0,
    proportionalByRemainingTime: rule?.proportionalByRemainingTime ?? true,
    allowManualAdjustments: rule?.allowManualAdjustments ?? true,
    formulaDescription: additionalRules?.formulaDescription ?? fallbackFormula,
    standardNotes: rule?.standardNotes ?? "",
    legalSupportText: rule?.legalSupportText ?? "",
    active: rule?.active ?? true,
    additionalCharges: additionalRules?.defaultAdditionalCharges ?? [],
    discounts: additionalRules?.defaultDiscounts ?? [],
  };
}

export function ContractTerminationRulesPage() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const defaultFormula = `${t("leaseTermination.penaltyLabel").toLowerCase()} × ${t(
    "leaseTermination.proportionalMode",
  )} + ${t("leaseTermination.additionalCharges").toLowerCase()} - ${t(
    "leaseTermination.discounts",
  ).toLowerCase()}`;
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [form, setForm] = useState<RuleFormState>(parseRuleToForm(defaultFormula));

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
    const firstRule = rulesQuery.data?.[0];

    if (!selectedRuleId && firstRule) {
      setSelectedRuleId(firstRule.id);
    }
  }, [rulesQuery.data, selectedRuleId]);

  useEffect(() => {
    if (selectedRule) {
      setForm(parseRuleToForm(defaultFormula, selectedRule));
    }
  }, [defaultFormula, selectedRule]);

  const saveMutation = useMutation({
    mutationFn: () =>
      contractsService.saveTerminationRule(accessToken!, {
        id: form.id,
        name: form.name,
        penaltyPercentage: form.penaltyPercentage,
        proportionalByRemainingTime: form.proportionalByRemainingTime,
        allowManualAdjustments: form.allowManualAdjustments,
        additionalCharges: form.additionalCharges,
        discounts: form.discounts,
        formulaDescription: form.formulaDescription,
        standardNotes: form.standardNotes || null,
        legalSupportText: form.legalSupportText || null,
        active: form.active,
      }),
    onSuccess: async () => {
      toast.success(t("leaseTermination.ruleSaveSuccess"));
      await queryClient.invalidateQueries({ queryKey: ["termination-rules"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("leaseTermination.eyebrow")}
        title={t("leaseTermination.rulesTitle")}
        description={t("leaseTermination.rulesDescription")}
        actions={
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="secondary-button"
          >
            {saveMutation.isPending
              ? t("leaseTermination.rulesSavingButton")
              : t("leaseTermination.rulesSaveButton")}
          </button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <SectionCard
          title={t("leaseTermination.existingRulesTitle")}
          description={t("leaseTermination.existingRulesDescription")}
        >
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setSelectedRuleId("");
                setForm(parseRuleToForm(defaultFormula));
              }}
              className={`w-full rounded-[24px] border px-5 py-5 text-left transition ${
                !selectedRuleId
                  ? "border-brand-300 bg-brand-50"
                  : "border-ink-200 bg-[var(--elevated-bg)]"
              }`}
            >
              <p className="font-semibold text-ink-950">
                {t("leaseTermination.newRuleTitle")}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {t("leaseTermination.newRuleDescription")}
              </p>
            </button>

            {(rulesQuery.data ?? []).map((rule) => (
              <button
                key={rule.id}
                type="button"
                onClick={() => setSelectedRuleId(rule.id)}
                className={`w-full rounded-[24px] border px-5 py-5 text-left transition ${
                  selectedRuleId === rule.id
                    ? "border-brand-300 bg-brand-50"
                    : "border-ink-200 bg-[var(--elevated-bg)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink-950">{rule.name}</p>
                  {rule.active ? (
                    <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                      {t("leaseTermination.activeBadge")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-ink-500">
                  {t("leaseTermination.ruleSummary", {
                    penalty: rule.penaltyPercentage,
                    mode: rule.proportionalByRemainingTime
                      ? t("leaseTermination.proportionalMode")
                      : t("leaseTermination.fixedMode"),
                  })}
                </p>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={t("leaseTermination.editorTitle")}
          description={t("leaseTermination.editorDescription")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label={t("leaseTermination.nameLabel")}
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <FormInput
              label={t("leaseTermination.penaltyLabel")}
              type="number"
              step="0.01"
              value={form.penaltyPercentage}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  penaltyPercentage: Number(event.target.value || 0),
                }))
              }
            />
            <div className="md:col-span-2">
              <FormTextarea
                label={t("leaseTermination.formulaLabel")}
                value={form.formulaDescription}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    formulaDescription: event.target.value,
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <FormTextarea
                label={t("leaseTermination.standardNotesLabel")}
                value={form.standardNotes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    standardNotes: event.target.value,
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <FormTextarea
                label={t("leaseTermination.supportLabel")}
                value={form.legalSupportText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    legalSupportText: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FormSwitch
              label={t("leaseTermination.proportionalLabel")}
              checked={form.proportionalByRemainingTime}
              onChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  proportionalByRemainingTime: checked,
                }))
              }
            />
            <FormSwitch
              label={t("leaseTermination.manualAdjustLabel")}
              checked={form.allowManualAdjustments}
              onChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  allowManualAdjustments: checked,
                }))
              }
            />
            <FormSwitch
              label={t("leaseTermination.activeLabel")}
              checked={form.active}
              onChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  active: checked,
                }))
              }
            />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <LineItemsEditor
              title={t("leaseTermination.additionalChargesTitle")}
              description={t("leaseTermination.additionalChargesDescription")}
              items={form.additionalCharges}
              onChange={(items) =>
                setForm((current) => ({ ...current, additionalCharges: items }))
              }
            />
            <LineItemsEditor
              title={t("leaseTermination.discountsTitle")}
              description={t("leaseTermination.discountsDescription")}
              items={form.discounts}
              onChange={(items) =>
                setForm((current) => ({ ...current, discounts: items }))
              }
            />
          </div>

          <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            {t("leaseTermination.legalWarning")}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
