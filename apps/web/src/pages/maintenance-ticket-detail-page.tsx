import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appRoutes } from "@imobiliaria/shared";
import {
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  NotebookTabs,
  Paperclip,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useAuth } from "@/features/auth/auth-context";
import { MaintenanceModuleNav } from "@/features/maintenance/maintenance-module-nav";
import { MaintenanceStatusPanel } from "@/features/maintenance/maintenance-status-panel";
import { MaintenanceUrgencyBadge } from "@/features/maintenance/maintenance-urgency-badge";
import { buildDetailPath, formatDate, formatDateTime } from "@/lib/format";
import {
  formatOpenDuration,
  getMaintenanceTriageDecisionLabel,
  getMaintenanceTriageTone,
  getMaintenanceTypeLabel,
} from "@/lib/maintenance";
import { resolveStatusTone } from "@/lib/status";
import { maintenanceService } from "@/services/maintenance-service";
import { usersService } from "@/services/users-service";

function renderHistoryValue(value: unknown) {
  if (value === null || value === undefined) {
    return "Nao informado";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return JSON.stringify(value, null, 2);
}

export function MaintenanceTicketDetailPage() {
  const { ticketId = "" } = useParams();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  const detailQuery = useQuery({
    queryKey: ["maintenance-ticket-detail", ticketId],
    queryFn: () => maintenanceService.getById(accessToken!, ticketId),
    enabled: Boolean(accessToken && ticketId),
  });

  const usersQuery = useQuery({
    queryKey: ["maintenance-detail-assignable-users"],
    queryFn: () => usersService.listAssignable(accessToken!),
    enabled: Boolean(accessToken),
  });

  const statusMutation = useMutation({
    mutationFn: (payload: Parameters<typeof maintenanceService.updateStatus>[2]) =>
      maintenanceService.updateStatus(accessToken!, ticketId, payload),
    onSuccess: async () => {
      toast.success("Movimentacao do chamado registrada.");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["maintenance-ticket-detail", ticketId],
        }),
        queryClient.invalidateQueries({ queryKey: ["maintenance-tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenance-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenance-kanban"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
  });

  const triageMutation = useMutation({
    mutationFn: (payload: Parameters<typeof maintenanceService.triage>[2]) =>
      maintenanceService.triage(accessToken!, ticketId, payload),
    onSuccess: async () => {
      toast.success("Triagem do chamado registrada.");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["maintenance-ticket-detail", ticketId],
        }),
        queryClient.invalidateQueries({ queryKey: ["maintenance-tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenance-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenance-kanban"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
  });

  const ticket = detailQuery.data;

  const responsibleOptions = useMemo(
    () => [
      { value: "", label: "Sem responsavel definido" },
      ...((usersQuery.data ?? []).map((user) => ({
        value: user.id,
        label: user.fullName,
      })) ?? []),
    ],
    [usersQuery.data],
  );

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Operacao tecnica"
          title="Carregando chamado"
          description="Buscando historico, contexto do imovel e trilha de manutencao."
        />
        <MaintenanceModuleNav />
        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="panel-card skeleton-shimmer h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <EmptyState
        title="Chamado nao encontrado"
        description="Nao foi possivel localizar o ticket solicitado."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detalhe tecnico"
        title={ticket.ticketId}
        description={`${ticket.title} - ${ticket.property.code} - ${ticket.property.title}`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <MaintenanceUrgencyBadge urgencyLevel={ticket.urgencyLevel} />
            <StatusBadge
              label={ticket.statusLabel}
              tone={resolveStatusTone(ticket.status)}
            />
          </div>
        }
      />

      <MaintenanceModuleNav />

      <div className="grid gap-5 md:grid-cols-4">
        {[
          { label: "Tempo em aberto", value: formatOpenDuration(ticket.openDays) },
          {
            label: "Dias sem atualizacao",
            value: `${ticket.daysWithoutUpdate} dia(s)`,
          },
          {
            label: "Anexos",
            value: `${ticket.metrics.attachmentCount}`,
          },
          {
            label: "Eventos no historico",
            value: `${ticket.metrics.historyCount}`,
          },
        ].map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-3xl text-ink-950">
              {item.value}
            </p>
          </SectionCard>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <SectionCard
            title="Resumo do chamado"
            description="Contexto principal, impacto relatado e leitura de SLA."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-400">
                  Descricao detalhada
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink-700">
                  {ticket.description}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-400">
                  Ultima atualizacao
                </p>
                <p className="mt-2 text-sm font-semibold text-ink-900">
                  {formatDateTime(ticket.updatedAt)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-400">
                  Triagem operacional
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getMaintenanceTriageTone(ticket.triageDecision)}`}
                >
                  {getMaintenanceTriageDecisionLabel(ticket.triageDecision)}
                </span>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-600">
                  {ticket.triageNotes ?? "Ainda sem observação de triagem."}
                </p>
                <p className="mt-1 text-xs text-ink-400">
                  {ticket.triagedAt
                    ? `Registrada em ${formatDateTime(ticket.triagedAt)} por ${ticket.triagedByUser?.fullName ?? "sistema"}`
                    : "Ainda não triado formalmente."}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-400">
                  Prazo interno (SLA)
                </p>
                <p
                  className={`mt-2 text-sm font-semibold ${
                    ticket.isOverdue ? "text-rose-700" : "text-ink-900"
                  }`}
                >
                  {ticket.isOverdue
                    ? `Vencido desde ${formatDateTime(ticket.slaDueAt)}`
                    : `Ate ${formatDateTime(ticket.slaDueAt)}`}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-400">
                  Resolucao
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700">
                  {ticket.resolutionSummary ?? "Ainda sem resumo registrado."}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-400">
                  Cancelamento
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700">
                  {ticket.cancelReason ?? "Chamado nao cancelado."}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-400">
                  Observacoes internas
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700">
                  {ticket.internalNotes ?? "Sem observacoes internas ate o momento."}
                </p>
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-5 lg:grid-cols-2">
            <SectionCard
              title="Imovel vinculado"
              description="Origem patrimonial e endereco consolidado do ticket."
            >
              <div className="space-y-4 text-sm text-ink-700">
                <div className="flex items-start gap-3">
                  <Building2 size={18} className="mt-0.5 text-brand-600" />
                  <div>
                    <Link
                      to={buildDetailPath(appRoutes.propertyDetail, ticket.property.id)}
                      className="font-semibold text-ink-950 transition hover:text-brand-700"
                    >
                      {ticket.property.code} - {ticket.property.title}
                    </Link>
                    <p className="mt-1 text-ink-500">
                      {ticket.property.street}, {ticket.property.streetNumber} - {ticket.property.district},{" "}
                      {ticket.property.city}/{ticket.property.state}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
                    Proprietario
                  </p>
                  <p className="mt-2 font-medium text-ink-900">
                    {ticket.property.owner.fullName}
                  </p>
                  <p className="mt-1 text-ink-500">
                    {ticket.property.owner.document}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Partes e atendimento"
              description="Solicitante, locatario atual e responsavel pela execucao."
            >
              <div className="space-y-4 text-sm text-ink-700">
                <div className="flex items-start gap-3">
                  <UserRound size={18} className="mt-0.5 text-brand-600" />
                  <div>
                    <p className="font-semibold text-ink-950">
                      {ticket.tenant?.fullName ?? "Sem locatario vinculado"}
                    </p>
                    <p className="mt-1 text-ink-500">
                      {ticket.tenant?.document ?? "Sem documento vinculado"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
                    Aberto por
                  </p>
                  <p className="mt-2 font-medium text-ink-900">
                    {ticket.openedByUser.fullName}
                  </p>
                  <p className="mt-1 text-ink-500">{ticket.openedByUser.email}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
                    Responsavel atual
                  </p>
                  <p className="mt-2 font-medium text-ink-900">
                    {ticket.assignedToUser?.fullName ?? "Nao definido"}
                  </p>
                  <p className="mt-1 text-ink-500">
                    {ticket.assignedToUser?.email ?? "Sem e-mail vinculado"}
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Anexos e fotos"
            description="Estrutura pronta para URLs de evidencias, laudos e imagens do atendimento."
          >
            {ticket.attachments.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {ticket.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[24px] border border-ink-200 bg-white px-4 py-4 text-sm text-ink-700 transition hover:border-brand-200"
                  >
                    <div className="flex items-start gap-3">
                      <Paperclip size={18} className="mt-0.5 text-brand-600" />
                      <div>
                        <p className="font-semibold text-ink-950">{attachment.name}</p>
                        <p className="mt-1 text-ink-500">{attachment.mimeType}</p>
                        <p className="mt-1 text-ink-500">
                          Registrado em {formatDateTime(attachment.createdAt)}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhum anexo registrado"
                description="Quando fotos, laudos ou arquivos forem vinculados, eles aparecerao aqui."
              />
            )}
          </SectionCard>

          <SectionCard
            title="Historico do chamado"
            description="Toda movimentacao relevante fica registrada para rastreabilidade e auditoria."
          >
            {ticket.history.length ? (
              <div className="space-y-4">
                {ticket.history.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[28px] border border-ink-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,246,241,0.92))] px-5 py-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink-950">
                          {item.description}
                        </p>
                        <p className="mt-1 text-sm text-ink-500">
                          {item.user?.fullName ?? "Sistema"} - {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                      <span className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                        {item.actionType}
                      </span>
                    </div>

                    {(Boolean(item.oldValue) || Boolean(item.newValue)) && (
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-[22px] border border-ink-200 bg-white px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
                            Valor anterior
                          </p>
                          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-ink-600">
                            {renderHistoryValue(item.oldValue)}
                          </pre>
                        </div>
                        <div className="rounded-[22px] border border-ink-200 bg-white px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
                            Novo valor
                          </p>
                          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-ink-600">
                            {renderHistoryValue(item.newValue)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Historico ainda vazio"
                description="As movimentacoes relevantes deste ticket aparecerao aqui."
              />
            )}
          </SectionCard>
        </div>

        <div className="space-y-5">
          <MaintenanceStatusPanel
            currentStatus={ticket.status}
            currentAssignedToUserId={ticket.assignedToUser?.id}
            currentTriageDecision={ticket.triageDecision}
            responsibleOptions={responsibleOptions}
            pending={statusMutation.isPending}
            triagePending={triageMutation.isPending}
            onSubmit={async (payload) => {
              await statusMutation.mutateAsync(payload);
            }}
            onTriage={async (payload) => {
              await triageMutation.mutateAsync(payload);
            }}
          />

          <SectionCard
            title="Linha do tempo do ticket"
            description="Marcos principais desde a abertura do chamado."
          >
            <div className="space-y-4 text-sm text-ink-700">
              {[
                {
                  label: "Abertura",
                  value: formatDateTime(ticket.createdAt),
                  icon: <NotebookTabs size={16} />,
                },
                {
                  label: "Ultima mudanca de status",
                  value: formatDateTime(ticket.lastStatusChangeAt),
                  icon: <Clock3 size={16} />,
                },
                {
                  label: "Resolvido em",
                  value: ticket.resolvedAt
                    ? formatDateTime(ticket.resolvedAt)
                    : "Ainda nao resolvido",
                  icon: <CheckCircle2 size={16} />,
                },
                {
                  label: "Finalizado em",
                  value: ticket.finishedAt
                    ? formatDateTime(ticket.finishedAt)
                    : "Ainda nao finalizado",
                  icon: <FileText size={16} />,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-[22px] border border-ink-200 bg-white px-4 py-4"
                >
                  <span className="mt-0.5 text-brand-600">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-ink-900">{item.label}</p>
                    <p className="mt-1 text-ink-500">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Contexto do atendimento"
            description="Resumo rapido para escritorio, locacao e manutencao."
          >
            <div className="space-y-3 text-sm text-ink-600">
              <p>Tipo do chamado: {getMaintenanceTypeLabel(ticket.type)}</p>
              <p>Urgencia: nivel {ticket.urgencyLevel}</p>
              <p>Tempo em aberto: {formatOpenDuration(ticket.openDays)}</p>
              <p>Endereco resumido: {ticket.property.addressSummary}</p>
              <p>Ultima leitura: {formatDate(ticket.updatedAt)}</p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
