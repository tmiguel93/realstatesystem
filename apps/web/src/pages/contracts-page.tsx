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
        eyebrow="Gestao contratual"
        title="Contratos ativos"
        description="Acompanhe minutas, revisoes, assinatura pendente, contratos vigentes e alertas de vencimento."
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
          { label: "Ativos na pagina", value: metrics.active },
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
        description="Busque por codigo, imovel, locador ou locatario e destaque contratos proximos do vencimento."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_220px]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por codigo, imovel, locador ou locatario"
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
            {onlyExpiring ? "Mostrando vencimento" : "Somente a vencer"}
          </button>
        </div>
      </SectionCard>

      {contracts.length ? (
        <SectionCard
          title="Lista operacional"
          description="Cada contrato preserva o historico de versoes, responsavel pela revisao e status atual."
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-200">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-ink-400">
                  <th className="pb-4 pr-4 font-medium">Contrato</th>
                  <th className="pb-4 pr-4 font-medium">Imovel</th>
                  <th className="pb-4 pr-4 font-medium">Partes</th>
                  <th className="pb-4 pr-4 font-medium">Vigencia</th>
                  <th className="pb-4 pr-4 font-medium">Status</th>
                  <th className="pb-4 pr-4 font-medium">Ultima versao</th>
                  <th className="pb-4 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 text-sm text-ink-700">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="align-top">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-ink-950">{contract.code}</p>
                      <p className="mt-1 text-ink-500">
                        {formatCurrency(contract.rentAmount)} · dia {contract.dueDay}
                      </p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-ink-900">{contract.property.title}</p>
                      <p className="mt-1 text-ink-500">{contract.property.code}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p>Locador: {contract.owner.fullName}</p>
                      <p className="mt-1">Locatario: {contract.tenant.fullName}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p>
                        {formatDate(contract.startDate)} ate {formatDate(contract.endDate)}
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
                    <td className="py-4 pr-4">
                      <StatusBadge
                        label={getOptionLabel(contractStatusOptions, contract.status)}
                        tone={resolveStatusTone(contract.status)}
                      />
                    </td>
                    <td className="py-4 pr-4">
                      {contract.latestVersion ? (
                        <>
                          <p className="font-medium text-ink-900">
                            Versao {contract.latestVersion.versionNumber}
                          </p>
                          <p className="mt-1 text-ink-500">
                            {contract.latestVersion.reviewedByUser?.fullName ??
                              "Sem responsavel de revisao"}
                          </p>
                        </>
                      ) : (
                        <span className="text-ink-500">Sem versao</span>
                      )}
                    </td>
                    <td className="py-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            buildDetailPath(appRoutes.contractDetail, contract.id),
                          )
                        }
                        className="rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-200 hover:text-brand-700"
                      >
                        Abrir detalhe
                      </button>
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
          description="A partir daqui voce acompanha minutas, assinatura pendente, vigencia e vencimento."
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
