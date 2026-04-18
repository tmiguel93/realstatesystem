import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  appRoutes,
  leadStatusOptions,
  rentLeadStageOptions,
} from "@imobiliaria/shared";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useAuth } from "@/features/auth/auth-context";
import { RentLeadFormDrawer } from "@/features/rents/rent-lead-form-drawer";
import { buildDetailPath, formatCurrency, formatDateTime } from "@/lib/format";
import { getOptionLabel } from "@/lib/options";
import { resolveStatusTone } from "@/lib/status";
import { propertiesService } from "@/services/properties-service";
import { rentsService } from "@/services/rents-service";
import { tenantsService } from "@/services/tenants-service";
import { usersService } from "@/services/users-service";
import type { RentLeadListItem } from "@/types/domain";

export function RentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<RentLeadListItem | null>(null);

  const deferredSearch = useDeferredValue(search);

  const leadsQuery = useQuery({
    queryKey: ["rent-leads-board", deferredSearch, statusFilter, responsibleFilter],
    queryFn: () =>
      rentsService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 100,
        search: deferredSearch || undefined,
        status: statusFilter || undefined,
        responsibleUserId: responsibleFilter || undefined,
      }),
    enabled: Boolean(accessToken),
  });

  const usersQuery = useQuery({
    queryKey: ["assignable-users"],
    queryFn: () => usersService.listAssignable(accessToken!),
    enabled: Boolean(accessToken),
  });

  const propertiesQuery = useQuery({
    queryKey: ["properties-select"],
    queryFn: () =>
      propertiesService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(accessToken),
  });

  const tenantsQuery = useQuery({
    queryKey: ["tenants-select"],
    queryFn: () =>
      tenantsService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(accessToken),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof rentsService.create>[1]) =>
      rentsService.create(accessToken!, payload),
    onSuccess: async () => {
      toast.success("Lead de locacao criado com sucesso.");
      setDrawerOpen(false);
      setSelectedLead(null);
      await queryClient.invalidateQueries({ queryKey: ["rent-leads-board"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof rentsService.update>[2]) =>
      rentsService.update(accessToken!, selectedLead!.id, payload),
    onSuccess: async () => {
      toast.success("Lead de locacao atualizado.");
      setDrawerOpen(false);
      setSelectedLead(null);
      await queryClient.invalidateQueries({ queryKey: ["rent-leads-board"] });
      if (selectedLead) {
        await queryClient.invalidateQueries({
          queryKey: ["rent-lead-detail", selectedLead.id],
        });
      }
    },
  });

  const leads = leadsQuery.data?.data ?? [];
  const responsibleOptions = (usersQuery.data ?? []).map((user) => ({
    value: user.id,
    label: user.fullName,
  }));
  const propertyOptions = (propertiesQuery.data?.data ?? []).map((property) => ({
    value: property.id,
    label: `${property.code} - ${property.title}`,
  }));
  const tenantOptions = (tenantsQuery.data?.data ?? []).map((tenant) => ({
    value: tenant.id,
    label: tenant.fullName,
  }));

  const metrics = useMemo(
    () => ({
      open: leads.filter((lead) => lead.status === "OPEN").length,
      won: leads.filter((lead) => lead.status === "WON").length,
      contracts: leads.reduce((acc, lead) => acc + lead.contractCount, 0),
    }),
    [leads],
  );

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline locaticio"
        title="Locacao"
        description="Gerencie o funil de aluguel com etapa, garantia, locatario, follow-up e imovel vinculado."
        actions={
          <button
            type="button"
            onClick={() => {
              setSelectedLead(null);
              setDrawerOpen(true);
            }}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-sand-50"
          >
            Novo lead
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Leads em aberto", value: metrics.open },
          { label: "Ativados", value: metrics.won },
          { label: "Contratos vinculados", value: metrics.contracts },
        ].map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-4xl text-ink-950">{item.value}</p>
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Filtro tatico"
        description="Acompanhe os ultimos 100 leads de locacao por responsavel e situacao operacional."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_260px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por codigo, cliente, telefone ou email"
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">Todos os status</option>
            {leadStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={responsibleFilter}
            onChange={(event) => setResponsibleFilter(event.target.value)}
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">Todos os responsaveis</option>
            {responsibleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      {leads.length ? (
        <div className="grid gap-5 overflow-x-auto xl:grid-cols-3 2xl:grid-cols-4">
          {rentLeadStageOptions.map((stage) => {
            const stageLeads = leads.filter((lead) => lead.pipelineStage === stage.value);

            return (
              <SectionCard
                key={stage.value}
                title={stage.label}
                description={`${stageLeads.length} lead(s) nesta etapa`}
              >
                <div className="space-y-3">
                  {stageLeads.length ? (
                    stageLeads.map((lead) => (
                      <article
                        key={lead.id}
                        className="rounded-3xl border border-ink-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
                              {lead.code}
                            </p>
                            <p className="mt-2 font-semibold text-ink-950">
                              {lead.customerName}
                            </p>
                          </div>
                          <StatusBadge
                            label={getOptionLabel(leadStatusOptions, lead.status)}
                            tone={resolveStatusTone(lead.status)}
                          />
                        </div>

                        <div className="mt-4 space-y-2 text-sm text-ink-600">
                          <p>
                            Responsavel: <span className="font-medium">{lead.responsibleUser.fullName}</span>
                          </p>
                          <p>
                            Imovel:{" "}
                            <span className="font-medium">
                              {lead.property
                                ? `${lead.property.code} - ${lead.property.title}`
                                : "Nao definido"}
                            </span>
                          </p>
                          <p>
                            Locatario:{" "}
                            <span className="font-medium">
                              {lead.tenant?.fullName ?? "Nao vinculado"}
                            </span>
                          </p>
                          <p>Budget: {formatCurrency(lead.monthlyBudget)}</p>
                          <p>Follow-up: {formatDateTime(lead.nextFollowUpAt)}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-ink-400">
                            {lead.visitCount} visita(s)
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(buildDetailPath(appRoutes.rentLeadDetail, lead.id))
                              }
                              className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700"
                            >
                              Detalhes
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLead(lead);
                                setDrawerOpen(true);
                              }}
                              className="rounded-2xl bg-ink-950 px-3 py-2 text-sm font-semibold text-white"
                            >
                              Editar
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-ink-200 bg-ink-50 px-4 py-5 text-sm text-ink-500">
                      Nenhum lead nesta etapa.
                    </div>
                  )}
                </div>
              </SectionCard>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Nenhum lead de locacao encontrado"
          description="Crie o primeiro lead para iniciar o pipeline de locacao."
          action={
            <button
              type="button"
              onClick={() => {
                setSelectedLead(null);
                setDrawerOpen(true);
              }}
              className="rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Cadastrar lead
            </button>
          }
        />
      )}

      <RentLeadFormDrawer
        open={drawerOpen}
        responsibleOptions={responsibleOptions}
        propertyOptions={propertyOptions}
        tenantOptions={tenantOptions}
        initialData={selectedLead}
        pending={pending}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedLead(null);
        }}
        onSubmit={async (values) => {
          if (selectedLead) {
            await updateMutation.mutateAsync(values);
            return;
          }

          await createMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
