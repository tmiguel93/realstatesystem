import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarClock,
  FileText,
  KeyRound,
  Landmark,
  UserRoundCheck,
} from "lucide-react";
import { SkeletonCard } from "@/components/feedback/skeleton-card";
import { StatCard } from "@/components/feedback/stat-card";
import { useAuth } from "@/features/auth/auth-context";
import { dashboardService } from "@/services/dashboard-service";

export function DashboardPage() {
  const { accessToken } = useAuth();

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => dashboardService.summary(accessToken!),
    enabled: Boolean(accessToken),
  });

  const statItems = summaryQuery.data
    ? [
        {
          label: "Imoveis disponiveis",
          value: summaryQuery.data.availableProperties,
          detail: "Ativos liberados para venda ou locacao no momento.",
          icon: <Building2 size={20} />,
        },
        {
          label: "Visitas do dia",
          value: summaryQuery.data.visitsToday,
          detail: "Compromissos confirmados para a agenda atual.",
          icon: <CalendarClock size={20} />,
        },
        {
          label: "Contratos ativos",
          value: summaryQuery.data.activeContracts,
          detail: "Locacoes em vigencia acompanhadas pela operacao.",
          icon: <FileText size={20} />,
        },
        {
          label: "Chaves em posse",
          value: summaryQuery.data.checkedOutKeys,
          detail: "Itens em circulacao que pedem controle de devolucao.",
          icon: <KeyRound size={20} />,
        },
        {
          label: "Oportunidades em vendas",
          value: summaryQuery.data.openSaleLeads,
          detail: "Leads comerciais ainda ativos no pipeline de vendas.",
          icon: <Landmark size={20} />,
        },
        {
          label: "Oportunidades em locacao",
          value: summaryQuery.data.openRentLeads,
          detail: "Leads de locacao em andamento e sob acompanhamento.",
          icon: <UserRoundCheck size={20} />,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {summaryQuery.isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))
          : statItems.map((item) => <StatCard key={item.label} {...item} />)}
      </section>

      <section>
        <article className="panel-card">
          <p className="text-xs uppercase tracking-[0.28em] text-brand-600">
            Prioridades do escritorio
          </p>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {[
              "Mantenha visitas e leads sempre vinculados ao imovel correto para preservar rastreabilidade.",
              "Use o controle de chaves como rotina diaria para evitar perda de contexto operacional.",
              "Revise contratos proximos de vencimento e acompanhe renovacoes com antecedencia.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(251,248,243,0.88))] px-4 py-4 text-sm text-ink-600 shadow-[0_16px_34px_-28px_rgba(24,57,48,0.32)]"
              >
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
