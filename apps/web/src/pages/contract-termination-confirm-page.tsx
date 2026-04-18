import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appRoutes } from "@imobiliaria/shared";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { FormTextarea } from "@/components/form/form-textarea";
import { useAuth } from "@/features/auth/auth-context";
import { useI18n } from "@/features/preferences/language-provider";
import { buildDetailPath, formatCurrency } from "@/lib/format";
import { contractsService } from "@/services/contracts-service";
import type { LeaseTerminationSimulation } from "@/types/domain";

function getStorageKey(contractId: string) {
  return `imobiliaria.termination.${contractId}`;
}

export function ContractTerminationConfirmPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { contractId = "" } = useParams();
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [reason, setReason] = useState("");
  const [finalNotes, setFinalNotes] = useState("");

  const contractQuery = useQuery({
    queryKey: ["contract-detail", contractId],
    queryFn: () => contractsService.getById(accessToken!, contractId),
    enabled: Boolean(accessToken && contractId),
  });

  const simulation = useMemo(() => {
    const simulationId = searchParams.get("simulationId");
    const rawValue = window.sessionStorage.getItem(getStorageKey(contractId));

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as LeaseTerminationSimulation;
    return simulationId && parsed.id !== simulationId ? null : parsed;
  }, [contractId, searchParams]);

  const confirmMutation = useMutation({
    mutationFn: () =>
      contractsService.confirmTermination(accessToken!, contractId, {
        simulationId: simulation!.id,
        reason,
        finalNotes: finalNotes || null,
      }),
    onSuccess: async () => {
      window.sessionStorage.removeItem(getStorageKey(contractId));
      toast.success(t("leaseTermination.confirmSuccess"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["contracts"] }),
        queryClient.invalidateQueries({ queryKey: ["contract-detail", contractId] }),
      ]);
      navigate(buildDetailPath(appRoutes.contractDetail, contractId));
    },
  });

  if (!simulation) {
    return (
      <EmptyState
        title={t("leaseTermination.confirmTitle")}
        description={t("leaseTermination.missingSimulationDescription")}
        action={
          <button
            type="button"
            onClick={() =>
              navigate(buildDetailPath(appRoutes.contractTerminationSimulate, contractId))
            }
            className="primary-button"
          >
            {t("leaseTermination.backToSimulationButton")}
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("leaseTermination.eyebrow")}
        title={t("leaseTermination.confirmTitle")}
        description={t("leaseTermination.confirmDescription")}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <SectionCard title={t("leaseTermination.summaryTitle")}>
          <div className="space-y-4">
            <div className="rounded-[24px] border border-ink-200 bg-[var(--elevated-bg)] px-5 py-5">
              <p className="font-semibold text-ink-950">{contractQuery.data?.code}</p>
              <p className="mt-1 text-sm text-ink-500">
                {t("leaseTermination.finalAmount")}:{" "}
                {formatCurrency(simulation.finalAmount)}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {t("leaseTermination.calculatedPenalty")}:{" "}
                {formatCurrency(simulation.calculatedPenalty)}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {t("leaseTermination.additionalCharges")}:{" "}
                {formatCurrency(simulation.additionalCharges)}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {t("leaseTermination.discounts")}:{" "}
                {formatCurrency(simulation.discounts)}
              </p>
            </div>

            <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              {simulation.summaryJson.legalWarning}
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("leaseTermination.finalConfirmationTitle")}>
          <div className="space-y-4">
            <FormTextarea
              label={t("leaseTermination.terminationReasonLabel")}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <FormTextarea
              label={t("leaseTermination.finalNotesLabel")}
              value={finalNotes}
              onChange={(event) => setFinalNotes(event.target.value)}
            />
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="secondary-button"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void confirmMutation.mutate()}
                disabled={confirmMutation.isPending || reason.trim().length < 3}
                className="primary-button"
              >
                {confirmMutation.isPending
                  ? t("leaseTermination.confirmingButton")
                  : t("leaseTermination.finishTerminationButton")}
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
