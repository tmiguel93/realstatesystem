import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  appRoutes,
  contractStatusOptions,
  permissionCodes,
} from "@imobiliaria/shared";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PaginationControls } from "@/components/navigation/pagination-controls";
import { useAuth } from "@/features/auth/auth-context";
import { buildDetailPath, formatCurrency, formatDate } from "@/lib/format";
import { getOptionLabel } from "@/lib/options";
import { resolveStatusTone } from "@/lib/status";
import { contractsService } from "@/services/contracts-service";

export function ContractsPage() {
  const navigate = useNavigate();
  const { accessToken, hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [onlyExpiring, setOnlyExpiring] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const contractsQuery = useQuery({
    queryKey: ["contracts", page, deferredSearch, statusFilter, onlyExpiring],
    queryFn: () =>
      contractsService.list({
        accessToken: accessToken!,
        page,
        pageSize: 12,
        search: deferredSearch || undefined,
        status: statusFilter || undefined,
        onlyExpiring,
      }),
    enabled: Boolean(accessToken),
  });

  const contracts = contractsQuery.data?.data ?? [];
  const meta = contractsQuery.data?.meta;

  const metrics = useMemo(
    () => ({
      active: contracts.filter((contract) => contract.status === "ACTIVE").length,
      pending: contracts.filter((contract) =>
        ["DRAFT", "UNDER_REVIEW", "PENDING_SIGNATURE"].includes(contract.status),
      ).length,
      expiring: contracts.filter((contract) => contract.isExpiringSoon).length,
    }),
    [contracts],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestão contratual"
        title="Contratos ativos"
        description="Acompanhe minutas, revisões, assinatura pendente, contratos vigentes e alertas de vencimento."
        actions={
          hasPermission(permissionCodes.CONTRACTS_GENERATE) ? (
            <button
              type="button"
              onClick={() => navigate(appRoutes.contractGenerator)}
              className="secondary-button"
            >
              Gerar contrato
            </button>
          ) : null
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Ativos na página", value: metrics.active },
          { label: "Pendentes de fechamento", value: metrics.pending },
          { label: "Alertas de vencimento", value: metrics.expiring },
        ].map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-4xl text-ink-950">{item.value}</p>
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Filtro contratual"
        description="Busque por código, imóvel, locador ou locatário e destaque contratos próximos do vencimento."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_220px]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por código, imóvel, locador ou locatário"
            className="filter-control"
          />
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="filter-control"
          >
            <option value="">Todos os status</option>
            {contractStatusOptions.map((option: { value: string; label: string }) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setOnlyExpiring((current) => !current);
              setPage(1);
            }}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              onlyExpiring
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-ink-200 bg-white text-ink-700"
            }`}
          >
            {onlyExpiring ? "Mostrando a vencer" : "Somente a vencer"}
          </button>
        </div>
      </SectionCard>

      {contracts.length ? (
        <SectionCard
          title="Lista operacional"
          description="Cada contrato preserva o histórico de versões, o responsável pela revisão e o status atual."
        >
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contrato</th>
                  <th>Imóvel</th>
                  <th>Partes</th>
                  <th>Vigência</th>
                  <th>Status</th>
                  <th>Última versão</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>
                      <p className="font-semibold text-ink-950">{contract.code}</p>
                      <p className="mt-1 text-ink-500">
                        {formatCurrency(contract.rentAmount)} · dia {contract.dueDay}
                      </p>
                    </td>
                    <td>
                      <p className="font-medium text-ink-900">{contract.property.title}</p>
                      <p className="mt-1 text-ink-500">{contract.property.code}</p>
                    </td>
                    <td>
                      <p>Locador: {contract.owner.fullName}</p>
                      <p className="mt-1">Locatário: {contract.tenant.fullName}</p>
                    </td>
                    <td>
                      <p>
                        {formatDate(contract.startDate)} até {formatDate(contract.endDate)}
                      </p>
                      <p
                        className={`mt-1 ${
                          contract.isExpiringSoon ? "text-amber-700" : "text-ink-500"
                        }`}
                      >
                        {contract.daysToEnd >= 0
                          ? `${contract.daysToEnd} dia(s) restantes`
                          : "Prazo encerrado"}
                      </p>
                    </td>
                    <td>
                      <StatusBadge
                        label={getOptionLabel(contractStatusOptions, contract.status)}
                        tone={resolveStatusTone(contract.status)}
                      />
                    </td>
                    <td>
                      {contract.latestVersion ? (
                        <>
                          <p className="font-medium text-ink-900">
                            Versão {contract.latestVersion.versionNumber}
                          </p>
                          <p className="mt-1 text-ink-500">
                            {contract.latestVersion.reviewedByUser?.fullName ??
                              "Sem responsável de revisão"}
                          </p>
                        </>
                      ) : (
                        <span className="text-ink-500">Sem versão</span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(buildDetailPath(appRoutes.contractDetail, contract.id))
                          }
                          className="secondary-button px-3 py-2"
                        >
                          Abrir detalhe
                        </button>
                        {hasPermission(permissionCodes.LEASE_TERMINATION_SIMULATE) &&
                        ["ACTIVE", "RENEWED", "PENDING_SIGNATURE"].includes(contract.status) ? (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                buildDetailPath(
                                  appRoutes.contractTerminationSimulate,
                                  contract.id,
                                ),
                              )
                            }
                            className="primary-button px-3 py-2"
                          >
                            Simular baixa
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta ? (
            <PaginationControls
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </SectionCard>
      ) : (
        <EmptyState
          title="Nenhum contrato encontrado"
          description="A partir daqui você acompanha minutas, assinatura pendente, vigência e vencimento."
          action={
            hasPermission(permissionCodes.CONTRACTS_GENERATE) ? (
              <button
                type="button"
                onClick={() => navigate(appRoutes.contractGenerator)}
                className="primary-button"
              >
                Gerar primeiro contrato
              </button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
