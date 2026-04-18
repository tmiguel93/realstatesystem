import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { visitStatusOptions } from "@imobiliaria/shared";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PaginationControls } from "@/components/navigation/pagination-controls";
import { useAuth } from "@/features/auth/auth-context";
import { VisitFormDrawer } from "@/features/visits/visit-form-drawer";
import { formatDateTime } from "@/lib/format";
import { getOptionLabel } from "@/lib/options";
import { resolveStatusTone } from "@/lib/status";
import { propertiesService } from "@/services/properties-service";
import { rentsService } from "@/services/rents-service";
import { salesService } from "@/services/sales-service";
import { usersService } from "@/services/users-service";
import { visitsService } from "@/services/visits-service";
import type { VisitListItem } from "@/types/domain";

export function VisitsPage() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [brokerFilter, setBrokerFilter] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitListItem | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  const visitsQuery = useQuery({
    queryKey: ["visits", page, statusFilter, brokerFilter],
    queryFn: () =>
      visitsService.list({
        accessToken: accessToken!,
        page,
        pageSize: 10,
        status: statusFilter || undefined,
        brokerUserId: brokerFilter || undefined,
      }),
    enabled: Boolean(accessToken),
  });

  const detailQuery = useQuery({
    queryKey: ["visit-detail", selectedVisitId],
    queryFn: () => visitsService.getById(accessToken!, selectedVisitId!),
    enabled: Boolean(accessToken && selectedVisitId),
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

  const usersQuery = useQuery({
    queryKey: ["assignable-users"],
    queryFn: () => usersService.listAssignable(accessToken!),
    enabled: Boolean(accessToken),
  });

  const saleLeadsQuery = useQuery({
    queryKey: ["sale-leads-open"],
    queryFn: () =>
      salesService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 100,
        status: "OPEN",
      }),
    enabled: Boolean(accessToken),
  });

  const rentLeadsQuery = useQuery({
    queryKey: ["rent-leads-open"],
    queryFn: () =>
      rentsService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 100,
        status: "OPEN",
      }),
    enabled: Boolean(accessToken),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof visitsService.create>[1]) =>
      visitsService.create(accessToken!, payload),
    onSuccess: async () => {
      toast.success("Visita cadastrada com sucesso.");
      setDrawerOpen(false);
      setSelectedVisit(null);
      await queryClient.invalidateQueries({ queryKey: ["visits"] });
      await queryClient.invalidateQueries({ queryKey: ["sale-leads-board"] });
      await queryClient.invalidateQueries({ queryKey: ["rent-leads-board"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof visitsService.update>[2]) =>
      visitsService.update(accessToken!, selectedVisit!.id, payload),
    onSuccess: async () => {
      toast.success("Visita atualizada.");
      setDrawerOpen(false);
      setSelectedVisit(null);
      await queryClient.invalidateQueries({ queryKey: ["visits"] });
      if (selectedVisitId) {
        await queryClient.invalidateQueries({ queryKey: ["visit-detail", selectedVisitId] });
      }
      await queryClient.invalidateQueries({ queryKey: ["sale-leads-board"] });
      await queryClient.invalidateQueries({ queryKey: ["rent-leads-board"] });
    },
  });

  const visits = visitsQuery.data?.data ?? [];
  const selectedVisitDetail = detailQuery.data;
  const brokerOptions = (usersQuery.data ?? []).map((user) => ({
    value: user.id,
    label: user.fullName,
  }));
  const propertyOptions = (propertiesQuery.data?.data ?? []).map((property) => ({
    value: property.id,
    label: `${property.code} - ${property.title}`,
  }));
  const saleLeadOptions = (saleLeadsQuery.data?.data ?? []).map((lead) => ({
    value: lead.id,
    label: `${lead.code} - ${lead.customerName}`,
  }));
  const rentLeadOptions = (rentLeadsQuery.data?.data ?? []).map((lead) => ({
    value: lead.id,
    label: `${lead.code} - ${lead.customerName}`,
  }));

  const metrics = useMemo(
    () => ({
      today: visits.filter((visit) => {
        const scheduledAt = new Date(visit.scheduledAt);
        const now = new Date();
        return scheduledAt.toDateString() === now.toDateString();
      }).length,
      completed: visits.filter((visit) => visit.status === "COMPLETED").length,
      noShow: visits.filter((visit) => visit.status === "NO_SHOW").length,
    }),
    [visits],
  );

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Agenda operacional"
        title="Visitas"
        description="Agende, acompanhe comparecimento e registre o resultado de cada visita vinculada ao pipeline."
        actions={
          <button
            type="button"
            onClick={() => {
              setSelectedVisit(null);
              setDrawerOpen(true);
            }}
            className="secondary-button"
          >
            Nova visita
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Hoje", value: metrics.today },
          { label: "Concluidas", value: metrics.completed },
          { label: "Nao compareceu", value: metrics.noShow },
        ].map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-4xl text-ink-950">{item.value}</p>
          </SectionCard>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <SectionCard
          title="Agenda cadastrada"
          description="Filtre por status e corretor, depois revise o detalhe completo da visita ao lado."
        >
          <div className="mb-5 grid gap-4 lg:grid-cols-[220px_260px]">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            className="filter-control"
            >
              <option value="">Todos os status</option>
              {visitStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={brokerFilter}
              onChange={(event) => {
                setBrokerFilter(event.target.value);
                setPage(1);
              }}
            className="filter-control"
            >
              <option value="">Todos os corretores</option>
              {brokerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {visits.length ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
              <table className="data-table">
                  <thead>
                    <tr className="border-b border-ink-200 text-xs uppercase tracking-[0.18em] text-ink-400">
                      <th className="pb-3">Agenda</th>
                      <th className="pb-3">Imovel</th>
                      <th className="pb-3">Lead</th>
                      <th className="pb-3">Corretor</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((visit) => (
                      <tr key={visit.id} className="border-b border-ink-100 last:border-b-0">
                        <td className="py-4">
                          <p className="font-semibold text-ink-900">{formatDateTime(visit.scheduledAt)}</p>
                          <p className="text-sm text-ink-500">{formatDateTime(visit.completedAt)}</p>
                        </td>
                        <td className="py-4 text-sm text-ink-600">
                          {visit.property.code} - {visit.property.title}
                        </td>
                        <td className="py-4 text-sm text-ink-600">
                          {visit.lead ? `${visit.lead.code} - ${visit.lead.customerName}` : "Sem lead"}
                        </td>
                        <td className="py-4 text-sm text-ink-600">{visit.broker.fullName}</td>
                        <td className="py-4">
                          <StatusBadge
                            label={getOptionLabel(visitStatusOptions, visit.status)}
                            tone={resolveStatusTone(visit.outcome ?? visit.status)}
                          />
                        </td>
                        <td className="py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedVisitId(visit.id)}
                              className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700"
                            >
                              Detalhes
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVisit(visit);
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
                page={visitsQuery.data?.meta.page ?? page}
                totalPages={visitsQuery.data?.meta.totalPages ?? 1}
                onPageChange={setPage}
              />
            </div>
          ) : (
            <EmptyState
              title="Nenhuma visita encontrada"
              description="Agende uma visita para acompanhar o comparecimento e o desdobramento comercial."
            />
          )}
        </SectionCard>

        <SectionCard title="Detalhe da visita" description="Selecione uma agenda para revisar observacoes e resultado.">
          {selectedVisitDetail ? (
            <div className="space-y-4">
              <div className="rounded-3xl bg-ink-50 px-5 py-5">
                <p className="font-display text-2xl text-ink-950">{formatDateTime(selectedVisitDetail.scheduledAt)}</p>
                <p className="mt-2 text-sm text-ink-500">
                  {selectedVisitDetail.property.code} - {selectedVisitDetail.property.title}
                </p>
                <div className="mt-3">
                  <StatusBadge
                    label={selectedVisitDetail.outcome ?? selectedVisitDetail.status}
                    tone={resolveStatusTone(selectedVisitDetail.outcome ?? selectedVisitDetail.status)}
                  />
                </div>
              </div>
              <div className="space-y-2 text-sm text-ink-700">
                <p>
                  <span className="font-semibold text-ink-900">Lead:</span>{" "}
                  {selectedVisitDetail.lead
                    ? `${selectedVisitDetail.lead.code} - ${selectedVisitDetail.lead.customerName}`
                    : "Nao informado"}
                </p>
                <p>
                  <span className="font-semibold text-ink-900">Corretor:</span>{" "}
                  {selectedVisitDetail.broker.fullName}
                </p>
                <p>
                  <span className="font-semibold text-ink-900">Criado por:</span>{" "}
                  {selectedVisitDetail.createdByUser.fullName}
                </p>
              </div>
              <div className="rounded-2xl border border-ink-200 bg-white px-4 py-4 text-sm text-ink-700">
                {selectedVisitDetail.notes ?? "Sem observacoes registradas."}
              </div>
              <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50 px-4 py-4 text-sm text-ink-600">
                {selectedVisitDetail.resultSummary ?? "Sem resumo de resultado."}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Selecione uma visita"
              description="Os detalhes da agenda aparecem aqui assim que voce abrir um registro."
            />
          )}
        </SectionCard>
      </div>

      <VisitFormDrawer
        open={drawerOpen}
        propertyOptions={propertyOptions}
        brokerOptions={brokerOptions}
        saleLeadOptions={saleLeadOptions}
        rentLeadOptions={rentLeadOptions}
        initialData={selectedVisit}
        pending={pending}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedVisit(null);
        }}
        onSubmit={async (values) => {
          if (selectedVisit) {
            await updateMutation.mutateAsync(values);
            return;
          }

          await createMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
