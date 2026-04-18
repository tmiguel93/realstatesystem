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
  const { accessToken, user } = useAuth();

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
          detail: "Base de ativos pronta para venda ou locacao.",
          icon: <Building2 size={20} />,
        },
        {
          label: "Visitas do dia",
          value: summaryQuery.data.visitsToday,
          detail: "Compromissos agendados para hoje.",
          icon: <CalendarClock size={20} />,
        },
        {
          label: "Contratos ativos",
          value: summaryQuery.data.activeContracts,
          detail: "Locacoes vigentes sob gestao do sistema.",
          icon: <FileText size={20} />,
        },
        {
          label: "Chaves em posse",
          value: summaryQuery.data.checkedOutKeys,
          detail: "Itens que exigem controle e devolucao.",
          icon: <KeyRound size={20} />,
        },
        {
          label: "Oportunidades em vendas",
          value: summaryQuery.data.openSaleLeads,
          detail: "Leads de venda ainda abertos no funil.",
          icon: <Landmark size={20} />,
        },
        {
          label: "Oportunidades em locacao",
          value: summaryQuery.data.openRentLeads,
          detail: "Leads de locacao em andamento.",
          icon: <UserRoundCheck size={20} />,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <div className="rounded-[32px] bg-hero-mesh p-6 text-white shadow-soft md:p-8">
          <p className="text-xs uppercase tracking-[0.32em] text-white/55">
            Painel executivo
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
            {user?.fullName.split(" ")[0]}, sua operacao esta pronta para crescer
            com ordem.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/72 md:text-base">
            A fundacao tecnica ja protege rotas, autentica usuarios, organiza o
            shell administrativo e deixa o produto pronto para os modulos centrais
            das proximas fases.
          </p>
        </div>

        <div className="rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-soft backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.28em] text-brand-600">
            Sessao atual
          </p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-ink-500">Usuario</p>
              <p className="font-display text-2xl text-ink-950">
                {user?.fullName}
              </p>
            </div>
            <div>
              <p className="text-sm text-ink-500">Perfil</p>
              <p className="text-sm font-semibold text-ink-900">
                {user?.roles.join(" · ")}
              </p>
            </div>
            <div>
              <p className="text-sm text-ink-500">Permissoes ativas</p>
              <p className="text-sm font-semibold text-ink-900">
                {user?.permissions.length ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {summaryQuery.isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))
          : statItems.map((item) => <StatCard key={item.label} {...item} />)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <article className="rounded-[30px] border border-white/50 bg-white/80 p-6 shadow-soft backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.28em] text-brand-600">
            O que ficou pronto na FASE 2
          </p>
          <ul className="mt-5 space-y-4 text-sm text-ink-600">
            <li className="rounded-2xl bg-ink-50 px-4 py-4">
              Backend com Express, Prisma, JWT, refresh token, seed de acesso e
              dashboard protegido.
            </li>
            <li className="rounded-2xl bg-ink-50 px-4 py-4">
              Frontend em React com Vite, Tailwind, React Router, TanStack Query e
              React Hook Form.
            </li>
            <li className="rounded-2xl bg-ink-50 px-4 py-4">
              Shell administrativo responsivo com sidebar dinamica, topbar e tema
              global comercial.
            </li>
            <li className="rounded-2xl bg-ink-50 px-4 py-4">
              Protected routes e guard de permissao prontos para os modulos das
              fases seguintes.
            </li>
          </ul>
        </article>

        <article className="rounded-[30px] border border-white/50 bg-white/80 p-6 shadow-soft backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.28em] text-brand-600">
            Proxima consolidacao
          </p>
          <div className="mt-5 space-y-4">
            {[
              "Cadastro completo de imoveis com formulario modular e listagem filtravel.",
              "Cadastro de proprietarios e locatarios com relacoes, historico e documentos.",
              "Gestao de usuarios com ativacao, inativacao e redefinicao de senha.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-4 text-sm text-brand-900"
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

