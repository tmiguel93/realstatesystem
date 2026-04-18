import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  appRoutes,
  maintenanceTicketStatusOptions,
  maintenanceTicketTypeOptions,
  maintenanceUrgencyOptions,
  permissionCodes,
} from "@imobiliaria/shared";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PaginationControls } from "@/components/navigation/pagination-controls";
import { useAuth } from "@/features/auth/auth-context";
import { MaintenanceModuleNav } from "@/features/maintenance/maintenance-module-nav";
import { MaintenanceUrgencyBadge } from "@/features/maintenance/maintenance-urgency-badge";
import { buildDetailPath, formatDateTime } from "@/lib/format";
import { formatOpenDuration, getMaintenanceTypeLabel } from "@/lib/maintenance";
import { resolveStatusTone } from "@/lib/status";
import { maintenanceService } from "@/services/maintenance-service";
import { propertiesService } from "@/services/properties-service";
import { usersService } from "@/services/users-service";

export function MaintenanceTicketsPage() {
  const navigate = useNavigate();
  const { accessToken, hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [openedByFilter, setOpenedByFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [onlyCritical, setOnlyCritical] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const ticketsQuery = useQuery({
    queryKey: [
      "maintenance-tickets",
      page,
      deferredSearch,
      statusFilter,
      typeFilter,
      urgencyFilter,
      propertyFilter,
      assignedFilter,
      openedByFilter,
      dateFrom,
      dateTo,
      onlyCritical,
    ],
    queryFn: () =>
      maintenanceService.list({
        accessToken: accessToken!,
        page,
        pageSize: 12,
        search: deferredSearch || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        urgencyLevel: urgencyFilter || undefined,
        propertyId: propertyFilter || undefined,
        assignedToUserId: assignedFilter || undefined,
        openedByUserId: openedByFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        onlyCritical: onlyCritical ? "true" : undefined,
      }),
    enabled: Boolean(accessToken),
    placeholderData: (previousData) => previousData,
  });

  const propertiesQuery = useQuery({
    queryKey: ["maintenance-filter-properties"],
    queryFn: () =>
      propertiesService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(accessToken),
  });

  const usersQuery = useQuery({
    queryKey: ["maintenance-filter-users"],
    queryFn: () => usersService.listAssignable(accessToken!),
    enabled: Boolean(accessToken),
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

  const tickets = ticketsQuery.data?.data ?? [];
  const meta = ticketsQuery.data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operacao tecnica"
        title="Lista de chamados de manutencao"
        description="Filtre tickets por urgencia, tipo, periodo, imovel e responsavel para conduzir a operacao com leitura rapida."
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
        title="Filtros operacionais"
        description="Use a combinacao de filtros para localizar tickets por carteira, responsavel, imovel e prioridade."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por ticket, titulo, descricao ou imovel"
            className="filter-control xl:col-span-2"
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
            {maintenanceTicketStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setPage(1);
            }}
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
            onChange={(event) => {
              setUrgencyFilter(event.target.value);
              setPage(1);
            }}
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
            onChange={(event) => {
              setPropertyFilter(event.target.value);
              setPage(1);
            }}
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
            onChange={(event) => {
              setAssignedFilter(event.target.value);
              setPage(1);
            }}
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
            onChange={(event) => {
              setOpenedByFilter(event.target.value);
              setPage(1);
            }}
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
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
            className="filter-control"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
            className="filter-control"
          />

          <button
            type="button"
            onClick={() => {
              setOnlyCritical((current) => !current);
              setPage(1);
            }}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              onlyCritical
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-ink-200 bg-white text-ink-700"
            }`}
          >
            {onlyCritical ? "Somente criticos" : "Filtrar criticos"}
          </button>
        </div>
      </SectionCard>

      {tickets.length ? (
        <SectionCard
          title="Leitura em lista"
          description="Cada linha preserva ticket, imovel, prioridade, responsavel e situacao do SLA para tomada de decisao rapida."
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-200">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-ink-400">
                  <th className="pb-4 pr-4 font-medium">Chamado</th>
                  <th className="pb-4 pr-4 font-medium">Imovel</th>
                  <th className="pb-4 pr-4 font-medium">Tipo / urgencia</th>
                  <th className="pb-4 pr-4 font-medium">Status</th>
                  <th className="pb-4 pr-4 font-medium">Tempo</th>
                  <th className="pb-4 pr-4 font-medium">Responsavel</th>
                  <th className="pb-4 pr-4 font-medium">Solicitante</th>
                  <th className="pb-4 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 text-sm text-ink-700">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="align-top">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-ink-950">{ticket.ticketId}</p>
                      <p className="mt-1 text-ink-900">{ticket.title}</p>
                      <p className="mt-1 line-clamp-2 text-ink-500">
                        {ticket.description}
                      </p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-ink-900">
                        {ticket.property.code} - {ticket.property.title}
                      </p>
                      <p className="mt-1 text-ink-500">
                        {ticket.property.addressSummary}
                      </p>
                      <p className="mt-1 text-ink-500">
                        Locatario: {ticket.tenant?.fullName ?? "Nao vinculado"}
                      </p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-ink-900">
                        {getMaintenanceTypeLabel(ticket.type)}
                      </p>
                      <div className="mt-2">
                        <MaintenanceUrgencyBadge urgencyLevel={ticket.urgencyLevel} />
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <StatusBadge
                        label={ticket.statusLabel}
                        tone={resolveStatusTone(ticket.status)}
                      />
                      <p
                        className={`mt-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                          ticket.isOverdue ? "text-rose-600" : "text-ink-400"
                        }`}
                      >
                        {ticket.isOverdue
                          ? "SLA vencido"
                          : `SLA ate ${formatDateTime(ticket.slaDueAt)}`}
                      </p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-ink-900">
                        {formatOpenDuration(ticket.openDays)}
                      </p>
                      <p className="mt-1 text-ink-500">
                        Ultima atualizacao em {formatDateTime(ticket.updatedAt)}
                      </p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-ink-900">
                        {ticket.assignedToUser?.fullName ?? "Nao definido"}
                      </p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-ink-900">
                        {ticket.openedByUser.fullName}
                      </p>
                      <p className="mt-1 text-ink-500">
                        {formatDateTime(ticket.createdAt)}
                      </p>
                    </td>
                    <td className="py-4">
                      <Link
                        to={buildDetailPath(appRoutes.maintenanceTicketDetail, ticket.id)}
                        className="inline-flex rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-200 hover:text-brand-700"
                      >
                        Abrir detalhe
                      </Link>
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
          title="Nenhum chamado encontrado"
          description="Quando os tickets forem registrados, voce vai acompanhar aqui a fila completa de manutencao com leitura operacional."
          action={
            hasPermission(permissionCodes.MAINTENANCE_WRITE) ? (
              <button
                type="button"
                onClick={() => navigate(appRoutes.maintenanceTicketNew)}
                className="primary-button"
              >
                Abrir primeiro chamado
              </button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
