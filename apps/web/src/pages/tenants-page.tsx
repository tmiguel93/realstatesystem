import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { appRoutes, scoreStatusOptions } from "@imobiliaria/shared";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { PaginationControls } from "@/components/navigation/pagination-controls";
import { useAuth } from "@/features/auth/auth-context";
import { TenantFormDrawer } from "@/features/tenants/tenant-form-drawer";
import { buildDetailPath } from "@/lib/format";
import { resolveStatusTone } from "@/lib/status";
import { tenantsService } from "@/services/tenants-service";
import type { TenantListItem } from "@/types/domain";

export function TenantsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantListItem | null>(null);

  const deferredSearch = useDeferredValue(search);

  const tenantsQuery = useQuery({
    queryKey: ["tenants", page, deferredSearch, statusFilter, scoreFilter],
    queryFn: () =>
      tenantsService.list({
        accessToken: accessToken!,
        page,
        pageSize: 10,
        search: deferredSearch || undefined,
        isActive: statusFilter || undefined,
        scoreStatus: scoreFilter || undefined,
      }),
    enabled: Boolean(accessToken),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof tenantsService.create>[1]) =>
      tenantsService.create(accessToken!, payload),
    onSuccess: async () => {
      toast.success("Locatario cadastrado com sucesso.");
      setDrawerOpen(false);
      setSelectedTenant(null);
      await queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof tenantsService.update>[2]) =>
      tenantsService.update(accessToken!, selectedTenant!.id, payload),
    onSuccess: async () => {
      toast.success("Locatario atualizado com sucesso.");
      setDrawerOpen(false);
      setSelectedTenant(null);
      await queryClient.invalidateQueries({ queryKey: ["tenants"] });
      await queryClient.invalidateQueries({
        queryKey: ["tenant-detail", selectedTenant?.id],
      });
    },
  });

  const metrics = useMemo(() => {
    const tenants = tenantsQuery.data?.data ?? [];
    return {
      active: tenants.filter((item) => item.isActive).length,
      approved: tenants.filter((item) => item.scoreStatus === "APPROVED").length,
      contracts: tenants.reduce((acc, item) => acc + item.contractCount, 0),
    };
  }, [tenantsQuery.data]);

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cadastros centrais"
        title="Locatarios"
        description="Controle score cadastral, historico de contratos e dados pessoais de quem ocupa ou pretende ocupar os ativos."
        actions={
          <button
            type="button"
            onClick={() => {
              setSelectedTenant(null);
              setDrawerOpen(true);
            }}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-sand-50"
          >
            Novo locatario
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Cadastros ativos", value: metrics.active },
          { label: "Scores aprovados", value: metrics.approved },
          { label: "Contratos no historico", value: metrics.contracts },
        ].map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-4xl text-ink-950">{item.value}</p>
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Lista operacional"
        description="Filtre por score, status do cadastro e navegue pelo historico relacional do locatario."
      >
        <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome, documento ou email"
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">Todos os status</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
          <select
            value={scoreFilter}
            onChange={(event) => {
              setScoreFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">Todos os scores</option>
            {scoreStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {tenantsQuery.data?.data.length ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-ink-200 text-xs uppercase tracking-[0.18em] text-ink-400">
                    <th className="pb-3">Locatario</th>
                    <th className="pb-3">Documento</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Contratos</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantsQuery.data.data.map((tenant) => (
                    <tr key={tenant.id} className="border-b border-ink-100 last:border-b-0">
                      <td className="py-4">
                        <p className="font-semibold text-ink-900">{tenant.fullName}</p>
                        <p className="text-sm text-ink-500">{tenant.email ?? "Sem email"}</p>
                      </td>
                      <td className="py-4 text-sm text-ink-600">{tenant.document}</td>
                      <td className="py-4">
                        <StatusBadge
                          label={
                            tenant.scoreValue !== null
                              ? `${tenant.scoreStatus} · ${tenant.scoreValue}`
                              : tenant.scoreStatus
                          }
                          tone={resolveStatusTone(tenant.scoreStatus)}
                        />
                      </td>
                      <td className="py-4 text-sm text-ink-600">
                        {tenant.contractCount} contratos
                      </td>
                      <td className="py-4">
                        <StatusBadge
                          label={tenant.isActive ? "Ativo" : "Inativo"}
                          tone={resolveStatusTone(tenant.isActive ? "ACTIVE" : "INACTIVE")}
                        />
                      </td>
                      <td className="py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                buildDetailPath(appRoutes.tenantDetail, tenant.id),
                              )
                            }
                            className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700"
                          >
                            Detalhes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setDrawerOpen(true);
                            }}
                            className="rounded-2xl bg-ink-950 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationControls
              page={tenantsQuery.data.meta.page}
              totalPages={tenantsQuery.data.meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : (
          <EmptyState
            title="Nenhum locatario encontrado"
            description="Cadastre locatarios para construir historico, score cadastral e vinculos contratuais."
            action={
              <button
                type="button"
                onClick={() => {
                  setSelectedTenant(null);
                  setDrawerOpen(true);
                }}
                className="rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white"
              >
                Cadastrar locatario
              </button>
            }
          />
        )}
      </SectionCard>

      <TenantFormDrawer
        open={drawerOpen}
        initialData={selectedTenant}
        pending={pending}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTenant(null);
        }}
        onSubmit={async (values) => {
          if (selectedTenant) {
            await updateMutation.mutateAsync(values);
            return;
          }

          await createMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
