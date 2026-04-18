import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  appRoutes,
  maintenanceTicketStatusOptions,
  maintenanceTicketTypeOptions,
  maintenanceUrgencyOptions,
  permissionCodes,
} from "@imobiliaria/shared";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { useAuth } from "@/features/auth/auth-context";
import { MaintenanceModuleNav } from "@/features/maintenance/maintenance-module-nav";
import { MaintenanceTicketCard } from "@/features/maintenance/maintenance-ticket-card";
import { getMaintenanceStatusLabel } from "@/lib/maintenance";
import { maintenanceService } from "@/services/maintenance-service";
import { propertiesService } from "@/services/properties-service";
import { usersService } from "@/services/users-service";

const quickStatusOptions = maintenanceTicketStatusOptions.filter(
  (option) => !["FINISHED", "CANCELLED"].includes(option.value),
);

export function MaintenanceKanbanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken, hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [openedByFilter, setOpenedByFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const deferredSearch = useDeferredValue(search);

  const kanbanQuery = useQuery({
    queryKey: [
      "maintenance-kanban",
      deferredSearch,
      statusFilter,
      typeFilter,
      urgencyFilter,
      propertyFilter,
      assignedFilter,
      openedByFilter,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      maintenanceService.kanban({
        accessToken: accessToken!,
        search: deferredSearch || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        urgencyLevel: urgencyFilter || undefined,
        propertyId: propertyFilter || undefined,
        assignedToUserId: assignedFilter || undefined,
        openedByUserId: openedByFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    enabled: Boolean(accessToken),
    placeholderData: (previousData) => previousData,
  });

  const propertiesQuery = useQuery({
    queryKey: ["maintenance-kanban-properties"],
    queryFn: () =>
      propertiesService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(accessToken),
  });

  const usersQuery = useQuery({
    queryKey: ["maintenance-kanban-users"],
    queryFn: () => usersService.listAssignable(accessToken!),
    enabled: Boolean(accessToken),
  });

  const quickMoveMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => maintenanceService.updateStatus(accessToken!, id, { status }),
    onSuccess: async (_, variables) => {
      toast.success(
        `Chamado movido para ${getMaintenanceStatusLabel(variables.status).toLowerCase()}.`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["maintenance-kanban"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenance-tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenance-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
  });

  const propertyOptions = useMemo(
    () =>
      (propertiesQuery.data?.data ?? []).map((property) => ({
        value: property.id,
        label: `${property.code} - ${property.title}`,
      })),
    [propertiesQuery.data],
  );

  const userOptions = useMemo(
    () =>
      (usersQuery.data ?? []).map((user) => ({
        value: user.id,
        label: user.fullName,
      })),
    [usersQuery.data],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operacao tecnica"
        title="Kanban de manutencao"
        description="Visualize a fila por status, mantenha o fluxo em movimento e destaque rapidamente os tickets com maior urgencia."
        actions={
          hasPermission(permissionCodes.MAINTENANCE_WRITE) ? (
            <button
              type="button"
              onClick={() => navigate(appRoutes.maintenanceTicketNew)}
              className="secondary-button"
            >
              Abrir chamado
            </button>
          ) : null
        }
      />

      <MaintenanceModuleNav />

      <SectionCard
        title="Filtros do kanban"
        description="Cruze os filtros para focar em urgencia, carteira, periodo, imovel ou responsavel."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por ticket, titulo, descricao ou imovel"
            className="filter-control xl:col-span-2"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="filter-control"
          >
            <option value="">Todos os status</option>
            {maintenanceTicketStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="filter-control"
          >
            <option value="">Todos os tipos</option>
            {maintenanceTicketTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={urgencyFilter}
            onChange={(event) => setUrgencyFilter(event.target.value)}
            className="filter-control"
          >
            <option value="">Todas as urgencias</option>
            {maintenanceUrgencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={propertyFilter}
            onChange={(event) => setPropertyFilter(event.target.value)}
            className="filter-control"
          >
            <option value="">Todos os imoveis</option>
            {propertyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={assignedFilter}
            onChange={(event) => setAssignedFilter(event.target.value)}
            className="filter-control"
          >
            <option value="">Todos os responsaveis</option>
            {userOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={openedByFilter}
            onChange={(event) => setOpenedByFilter(event.target.value)}
            className="filter-control"
          >
            <option value="">Todos os solicitantes</option>
            {userOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="filter-control"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="filter-control"
          />
        </div>
      </SectionCard>

      {kanbanQuery.data?.columns.some((column) => column.items.length > 0) ? (
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1380px] grid-cols-8 gap-4">
            {kanbanQuery.data?.columns.map((column) => (
              <div
                key={column.status}
                className="rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(245,241,234,0.88))] p-3 shadow-[0_20px_40px_-34px_rgba(24,57,48,0.24)]"
              >
                <div className="sticky top-0 z-10 rounded-[22px] border border-ink-200/80 bg-white/92 px-4 py-4 shadow-[0_10px_20px_-16px_rgba(24,57,48,0.16)] backdrop-blur-xl">
                  <p className="font-display text-xl text-ink-950">{column.label}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    {column.items.length} chamado(s)
                  </p>
                </div>

                <div className="mt-4 space-y-4">
                  {column.items.length ? (
                    column.items.map((ticket) => (
                      <MaintenanceTicketCard
                        key={ticket.id}
                        ticket={ticket}
                        footer={
                          ["FINISHED", "CANCELLED"].includes(ticket.status) ? (
                            <p className="text-xs text-ink-500">
                              Este ticket ja esta encerrado. Reabertura e ajustes sensiveis sao feitos no detalhe.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              <select
                                defaultValue={ticket.status}
                                onChange={(event) => {
                                  const nextStatus = event.target.value;
                                  if (nextStatus === ticket.status) {
                                    return;
                                  }
                                  void quickMoveMutation.mutateAsync({
                                    id: ticket.id,
                                    status: nextStatus,
                                  });
                                }}
                                className="field-control min-h-[46px] py-2 text-sm"
                              >
                                {quickStatusOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <p className="text-xs text-ink-500">
                                Finalizacao e cancelamento sao feitos no detalhe do chamado.
                              </p>
                            </div>
                          )
                        }
                      />
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">
                      Nenhum ticket nesta etapa.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="Nenhum ticket para o kanban"
          description="Quando os chamados forem registrados, o fluxo por status aparecera aqui."
        />
      )}
    </div>
  );
}
