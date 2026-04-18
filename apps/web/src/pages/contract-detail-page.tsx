import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adjustmentIndexOptions,
  appRoutes,
  contractOriginOptions,
  contractStatusOptions,
  contractVersionStatusOptions,
  guaranteeTypeOptions,
  permissionCodes,
} from "@imobiliaria/shared";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useAuth } from "@/features/auth/auth-context";
import { ContractStatusDrawer } from "@/features/contracts/contract-status-drawer";
import { buildDetailPath, formatCurrency, formatDate } from "@/lib/format";
import { getOptionLabel } from "@/lib/options";
import { resolveStatusTone } from "@/lib/status";
import { contractsService } from "@/services/contracts-service";

const BLOCKED_VERSION_STATUSES = ["ACTIVE", "TERMINATED", "CANCELLED", "EXPIRED", "RENEWED"];

export function ContractDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { contractId = "" } = useParams();
  const { accessToken, hasPermission } = useAuth();
  const [statusDrawerOpen, setStatusDrawerOpen] = useState(false);

  const contractQuery = useQuery({
    queryKey: ["contract-detail", contractId],
    queryFn: () => contractsService.getById(accessToken!, contractId),
    enabled: Boolean(accessToken && contractId),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      versionId,
      status,
    }: {
      versionId: string;
      status: "REVIEWED" | "FINALIZED";
    }) => contractsService.reviewVersion(accessToken!, contractId, versionId, status),
    onSuccess: async (_, variables) => {
      toast.success(
        variables.status === "FINALIZED"
          ? "Versao finalizada com sucesso."
          : "Versao revisada com sucesso.",
      );
      await queryClient.invalidateQueries({ queryKey: ["contract-detail", contractId] });
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (payload: {
      status: "ACTIVE" | "TERMINATED" | "CANCELLED" | "EXPIRED" | "RENEWED";
      terminationReason?: string | null;
    }) => contractsService.updateStatus(accessToken!, contractId, payload),
    onSuccess: async () => {
      toast.success("Status contratual atualizado.");
      setStatusDrawerOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["contract-detail", contractId] });
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });

  const contract = contractQuery.data;

  const latestVersion = contract?.versions[0] ?? null;
  const canCreateVersion = contract
    ? hasPermission(permissionCodes.CONTRACTS_GENERATE) &&
      !BLOCKED_VERSION_STATUSES.includes(contract.status)
    : false;

  const canChangeStatus = contract
    ? hasPermission(permissionCodes.CONTRACTS_REVIEW) &&
      ["DRAFT", "UNDER_REVIEW", "PENDING_SIGNATURE", "ACTIVE"].includes(
        contract.status,
      )
    : false;

  const versionMetrics = useMemo(
    () => ({
      reviewPending:
        contract?.versions.filter((version) => version.status === "DRAFT").length ?? 0,
      finalized:
        contract?.versions.filter((version) => version.status === "FINALIZED").length ?? 0,
    }),
    [contract],
  );

  if (!contract) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detalhe contratual"
        title={contract.code}
        description={`${getOptionLabel(contractOriginOptions, contract.originType)} com status ${getOptionLabel(contractStatusOptions, contract.status).toLowerCase()}.`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {canCreateVersion ? (
              <button
                type="button"
                onClick={() =>
                  navigate(`${appRoutes.contractGenerator}?contractId=${contract.id}`)
                }
                className="rounded-2xl border border-ink-200 bg-white px-5 py-3 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-700"
              >
                Nova versao
              </button>
            ) : null}
            {canChangeStatus ? (
              <button
                type="button"
                onClick={() => setStatusDrawerOpen(true)}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-sand-50"
              >
                Alterar status
              </button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-5 md:grid-cols-4">
        {[
          { label: "Versoes", value: contract.metrics.versionCount },
          { label: "Rascunhos pendentes", value: versionMetrics.reviewPending },
          { label: "Versoes finalizadas", value: versionMetrics.finalized },
          {
            label: "Dias para o termino",
            value: contract.metrics.daysToEnd >= 0 ? contract.metrics.daysToEnd : "Prazo encerrado",
          },
        ].map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-2xl text-ink-950">{item.value}</p>
          </SectionCard>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Resumo contratual">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Status</p>
              <div className="mt-2">
                <StatusBadge
                  label={getOptionLabel(contractStatusOptions, contract.status)}
                  tone={resolveStatusTone(contract.status)}
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Garantia</p>
              <p className="mt-2 text-sm text-ink-800">
                {getOptionLabel(guaranteeTypeOptions, contract.guaranteeType)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Reajuste</p>
              <p className="mt-2 text-sm text-ink-800">
                {getOptionLabel(adjustmentIndexOptions, contract.adjustmentIndex)} a cada{" "}
                {contract.adjustmentFrequencyMonths} mes(es)
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Aluguel</p>
              <p className="mt-2 text-sm text-ink-800">
                {formatCurrency(contract.rentAmount)} · vencimento dia {contract.dueDay}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Vigencia</p>
              <p className="mt-2 text-sm text-ink-800">
                {formatDate(contract.startDate)} ate {formatDate(contract.endDate)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Multa</p>
              <p className="mt-2 text-sm text-ink-800">
                {contract.lateFeePercentage !== null
                  ? `${contract.lateFeePercentage}%`
                  : "Nao informada"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-900">
            Minuta parametrizada com base interna. A validacao juridica continua obrigatoria antes do uso final.
          </div>
        </SectionCard>

        <SectionCard title="Partes e origem">
          <div className="space-y-4 text-sm text-ink-700">
            <div>
              <p className="font-semibold text-ink-900">Imovel</p>
              <p className="mt-1">
                {contract.property.code} · {contract.property.title}
              </p>
              <p className="mt-1 text-ink-500">
                {contract.property.street}, {contract.property.streetNumber} - {contract.property.district},{" "}
                {contract.property.city}/{contract.property.state}
              </p>
            </div>
            <div>
              <p className="font-semibold text-ink-900">Locador</p>
              <p className="mt-1">{contract.owner.fullName}</p>
              <p className="mt-1 text-ink-500">{contract.owner.document}</p>
            </div>
            <div>
              <p className="font-semibold text-ink-900">Locatario</p>
              <p className="mt-1">{contract.tenant.fullName}</p>
              <p className="mt-1 text-ink-500">{contract.tenant.document}</p>
            </div>
            {contract.rentLead ? (
              <div>
                <p className="font-semibold text-ink-900">Lead vinculado</p>
                <Link
                  to={buildDetailPath(appRoutes.rentLeadDetail, contract.rentLead.id)}
                  className="mt-1 inline-block text-brand-700 transition hover:text-brand-800"
                >
                  {contract.rentLead.code} · {contract.rentLead.customerName}
                </Link>
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard title="Historico de versoes">
          <div className="space-y-3">
            {contract.versions.map((version) => (
              <article
                key={version.id}
                className="rounded-3xl border border-ink-200 bg-white px-4 py-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-950">
                      Versao {version.versionNumber}
                    </p>
                    <p className="mt-1 text-sm text-ink-500">
                      Criada em {formatDate(version.createdAt)}
                    </p>
                  </div>
                  <StatusBadge
                    label={getOptionLabel(contractVersionStatusOptions, version.status)}
                    tone={resolveStatusTone(version.status)}
                  />
                </div>

                <p className="mt-3 text-sm text-ink-600">
                  Criada por {version.createdByUser.fullName}
                  {version.reviewedByUser
                    ? ` · revisada por ${version.reviewedByUser.fullName}`
                    : " · ainda sem responsavel de revisao"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {hasPermission(permissionCodes.CONTRACTS_REVIEW) &&
                  version.status === "DRAFT" ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          reviewMutation.mutate({
                            versionId: version.id,
                            status: "REVIEWED",
                          })
                        }
                        className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-200 hover:text-brand-700"
                      >
                        Revisar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          reviewMutation.mutate({
                            versionId: version.id,
                            status: "FINALIZED",
                          })
                        }
                        className="rounded-2xl bg-ink-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                      >
                        Finalizar
                      </button>
                    </>
                  ) : null}

                  {hasPermission(permissionCodes.CONTRACTS_EXPORT) ? (
                    <button
                      type="button"
                      onClick={() =>
                        contractsService.downloadPdf(
                          accessToken!,
                          contract.id,
                          version.id,
                          `${contract.code.toLowerCase()}-v${version.versionNumber}.pdf`,
                        )
                      }
                      className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-200 hover:text-brand-700"
                    >
                      Exportar PDF
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={latestVersion ? `Preview da versao ${latestVersion.versionNumber}` : "Preview"}
          description="A visualizacao abaixo corresponde ao HTML renderizado da ultima versao registrada."
        >
          {latestVersion ? (
            <div className="rounded-[28px] border border-ink-200 bg-white p-6 shadow-sm">
              <div
                className="contract-preview space-y-4 text-sm text-ink-700"
                dangerouslySetInnerHTML={{ __html: latestVersion.renderedHtml }}
              />
            </div>
          ) : null}
        </SectionCard>
      </div>

      <ContractStatusDrawer
        open={statusDrawerOpen}
        currentStatus={contract.status}
        pending={statusMutation.isPending}
        onClose={() => setStatusDrawerOpen(false)}
        onSubmit={async (payload) => {
          await statusMutation.mutateAsync(payload);
        }}
      />
    </div>
  );
}
