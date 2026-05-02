import { useQuery } from "@tanstack/react-query";
import { appRoutes, permissionCodes } from "@imobiliaria/shared";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListChecks,
  Siren,
  Wrench,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { SkeletonCard } from "@/components/feedback/skeleton-card";
import { useAuth } from "@/features/auth/auth-context";
import {
  MaintenanceHorizontalBars,
  MaintenanceTrendChart,
} from "@/features/maintenance/maintenance-dashboard-charts";
import { MaintenanceModuleNav } from "@/features/maintenance/maintenance-module-nav";
import { MaintenanceTicketCard } from "@/features/maintenance/maintenance-ticket-card";
import { maintenanceService } from "@/services/maintenance-service";

export function MaintenanceDashboardPage() {
  const navigate = useNavigate();
  const { accessToken, hasPermission } = useAuth();

  const dashboardQuery = useQuery({
    queryKey: ["maintenance-dashboard"],
    queryFn: () => maintenanceService.dashboard(accessToken!),
    enabled: Boolean(accessToken),
  });

  const dashboard = dashboardQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operacao tecnica"
        title="Dashboard de manutencao"
        description="Acompanhe chamados em aberto, gargalos de SLA, categorias mais recorrentes e os tickets que precisam de acao imediata."
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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {dashboardQuery.isLoading
          ? Array.from({ length: 10 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))
          : [
              {
                label: "Chamados abertos",
                value: dashboard?.indicators.totalOpen ?? 0,
                icon: <Wrench size={20} />,
                detail: "Volume atual que ainda depende de triagem ou execucao.",
              },
              {
                label: "Em andamento",
                value: dashboard?.indicators.inProgress ?? 0,
                icon: <Clock3 size={20} />,
                detail: "Tickets com prestador, material ou execucao ativa.",
              },
              {
                label: "Resolvidos",
                value: dashboard?.indicators.resolved ?? 0,
                icon: <CheckCircle2 size={20} />,
                detail: "Chamados solucionados aguardando fechamento operacional.",
              },
              {
                label: "Finalizados",
                value: dashboard?.indicators.finished ?? 0,
                icon: <ListChecks size={20} />,
                detail: "Encerramentos confirmados com historico consolidado.",
              },
              {
                label: "Cancelados",
                value: dashboard?.indicators.cancelled ?? 0,
                icon: <XCircle size={20} />,
                detail: "Itens encerrados sem continuidade operacional.",
              },
              {
                label: "Vencidos no SLA",
                value: dashboard?.indicators.overdueCount ?? 0,
                icon: <AlertTriangle size={20} />,
                detail: "Chamados acima do prazo interno definido pela urgencia.",
              },
              {
                label: "Tempo medio de resolucao",
                value: dashboard?.indicators.averageResolutionHours ?? 0,
                icon: <Siren size={20} />,
                detail: "Media em horas entre abertura e resolucao/finalizacao.",
              },
              {
                label: "Em triagem",
                value: dashboard?.indicators.triageCount ?? 0,
                icon: <FolderKanban size={20} />,
                detail: "Chamados aguardando decisão operacional inicial.",
              },
              {
                label: "Sem responsável",
                value: dashboard?.indicators.unassignedCount ?? 0,
                icon: <AlertTriangle size={20} />,
                detail: "Itens que precisam de dono claro para não ficarem parados.",
              },
              {
                label: "Emergenciais",
                value: dashboard?.indicators.emergencyCount ?? 0,
                icon: <Siren size={20} />,
                detail: "Chamados com triagem emergencial ou urgência máxima.",
              },
            ].map((item) => (
              <SectionCard key={item.label}>
                <div className="flex items-center justify-between gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-ink-950 to-brand-700 text-white shadow-[0_18px_34px_-24px_rgba(24,57,48,0.65)]">
                    {item.icon}
                  </div>
                  <p className="font-display text-4xl text-ink-950">{item.value}</p>
                </div>
                <p className="mt-4 text-sm font-semibold text-ink-800">
                  {item.label}
                </p>
                <p className="mt-2 text-sm text-ink-500">{item.detail}</p>
              </SectionCard>
            ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Status dos chamados"
          description="Leitura executiva do funil tecnico entre abertura, andamento, encerramento e cancelamento."
        >
          <MaintenanceHorizontalBars
            items={(dashboard?.charts.status ?? []).map((item, index) => ({
              ...item,
              tone:
                index === 0
                  ? "brand"
                  : index === 1
                    ? "warning"
                    : index === 2
                      ? "info"
                      : "danger",
            }))}
          />
        </SectionCard>

        <SectionCard
          title="Chamados por urgencia"
          description="Distribuicao dos tickets entre baixa, moderada, alta, muito alta e urgentissimo."
        >
          <MaintenanceHorizontalBars
            items={(dashboard?.charts.urgency ?? []).map((item) => ({
              ...item,
              tone:
                item.key === "5"
                  ? "danger"
                  : item.key === "4"
                    ? "warning"
                    : item.key === "3"
                      ? "warning"
                      : item.key === "2"
                        ? "info"
                        : "neutral",
            }))}
          />
        </SectionCard>

        <SectionCard
          title="Chamados por tipo"
          description="Categorias com maior incidencia operacional na carteira de imoveis."
        >
          <MaintenanceHorizontalBars
            items={(dashboard?.charts.types ?? []).slice(0, 8).map((item) => ({
              ...item,
              tone: "brand",
            }))}
            emptyMessage="Sem distribuicao por tipo disponivel ainda."
          />
        </SectionCard>

        <SectionCard
          title="Tempo medio de resolucao"
          description="Media de horas por nivel de urgencia para orientar prioridade, prestadores e revisao de rotina."
        >
          <MaintenanceHorizontalBars
            items={(dashboard?.charts.averageResolutionByUrgency ?? []).map((item) => ({
              ...item,
              tone:
                item.key === "5"
                  ? "danger"
                  : item.key === "4"
                    ? "warning"
                    : item.key === "3"
                      ? "warning"
                      : item.key === "2"
                        ? "info"
                        : "neutral",
            }))}
            valueSuffix="h"
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Evolucao operacional por dia"
        description="Leitura resumida dos ultimos sete dias entre tickets abertos, em andamento e encerrados."
      >
        <MaintenanceTrendChart items={dashboard?.charts.evolution ?? []} />
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <SectionCard
          title="Chamados criticos"
          description="Lista prioritaria com urgencia 5, tickets vencidos ou sem atualizacao recente."
        >
          {dashboard?.criticalTickets.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {dashboard.criticalTickets.map((ticket) => (
                <MaintenanceTicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum chamado critico agora"
              description="Quando houver tickets urgentissimos, vencidos no SLA ou sem atualizacao, eles aparecerao aqui."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Chamados por imovel"
          description="Imoveis com maior recorrencia de manutencao no periodo atual."
        >
          <MaintenanceHorizontalBars
            items={(dashboard?.byProperty ?? []).map((item) => ({
              ...item,
              tone: "brand",
            }))}
            emptyMessage="Ainda nao ha consolidacao por imovel."
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Atalhos do modulo"
        description="Transite rapido entre a operacao tecnica, a lista consolidada e a abertura de novos tickets."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Lista operacional",
              description:
                "Consulte filtros completos, responsaveis, periodos e situacao de SLA.",
              href: appRoutes.maintenanceTickets,
            },
            {
              title: "Kanban de manutencao",
              description:
                "Visualize o fluxo por status e mova tickets em progresso sem perder contexto.",
              href: appRoutes.maintenanceKanban,
            },
            {
              title: "Abrir novo chamado",
              description:
                "Registre um novo ticket com imovel, locatario, urgencia automatica e historico.",
              href: appRoutes.maintenanceTicketNew,
            },
          ].map((item) => (
            <Link
              key={item.title}
              to={item.href}
              className="rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,246,241,0.92))] px-5 py-5 shadow-[0_18px_34px_-28px_rgba(24,57,48,0.24)] transition duration-200 hover:-translate-y-0.5 hover:border-brand-200"
            >
              <p className="font-display text-2xl text-ink-950">{item.title}</p>
              <p className="mt-2 text-sm text-ink-500">{item.description}</p>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
