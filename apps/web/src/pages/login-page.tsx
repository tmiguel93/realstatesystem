import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { appRoutes } from "@imobiliaria/shared";
import { ArrowRight, Building2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { FormInput } from "@/components/form/form-input";

const loginSchema = z.object({
  email: z.string().email("Informe um email valido."),
  senha: z.string().min(1, "Informe sua senha."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      senha: "",
    },
  });

  const from =
    (location.state as { from?: string } | null)?.from ?? appRoutes.dashboard;

  const onSubmit = handleSubmit(async (values) => {
    await login(values);
    navigate(from, { replace: true });
  });

  return (
    <div className="min-h-screen bg-hero-mesh px-4 py-5 text-white md:px-8 md:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-40px)] max-w-7xl gap-6 overflow-hidden rounded-[36px] border border-white/10 bg-white/5 p-4 shadow-soft backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr] lg:p-6">
        <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/6 p-8 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_25%),linear-gradient(180deg,transparent,rgba(0,0,0,0.22))]" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/70">
              <Building2 size={14} />
              SaaS Imobiliario
            </p>

            <h1 className="mt-8 max-w-xl font-display text-4xl leading-tight md:text-6xl">
              Administracao imobiliaria com postura comercial e operacao madura.
            </h1>

            <p className="mt-5 max-w-2xl text-base text-white/72 md:text-lg">
              Centralize contratos, chaves, visitas, pipelines e acesso de
              usuarios em uma plataforma desenhada para produtividade real.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: <ShieldCheck size={18} />,
                  title: "RBAC real",
                  text: "Permissoes granulares e rotas protegidas ponta a ponta.",
                },
                {
                  icon: <LockKeyhole size={18} />,
                  title: "Sessao segura",
                  text: "JWT curto, refresh token e trilha basica de auditoria.",
                },
                {
                  icon: <ArrowRight size={18} />,
                  title: "Base escalavel",
                  text: "Arquitetura pronta para contratos, visitas e operacao multiusuario.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[26px] border border-white/10 bg-white/8 p-5 shadow-insetGlow"
                >
                  <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3 text-white">
                    {item.icon}
                  </div>
                  <p className="font-display text-xl">{item.title}</p>
                  <p className="mt-2 text-sm text-white/68">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center rounded-[30px] bg-[#f5f4f0] p-4 md:p-8">
          <div className="w-full max-w-md rounded-[30px] border border-ink-200/70 bg-white p-6 shadow-soft md:p-8">
            <p className="text-xs uppercase tracking-[0.32em] text-brand-600">
              Acesso seguro
            </p>
            <h2 className="mt-3 font-display text-3xl text-ink-950">
              Entrar na plataforma
            </h2>
            <p className="mt-2 text-sm text-ink-500">
              Use suas credenciais para acessar o ambiente administrativo.
            </p>

            <form className="mt-8 space-y-5" onSubmit={onSubmit}>
              <FormInput
                label="Email"
                type="email"
                placeholder="voce@empresa.com.br"
                error={errors.email?.message}
                {...register("email")}
              />

              <FormInput
                label="Senha"
                type="password"
                placeholder="Sua senha"
                error={errors.senha?.message}
                {...register("senha")}
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-ink-500">
                  <input
                    type="checkbox"
                    className="rounded border-ink-300 text-brand-600"
                  />
                  Manter sessao
                </label>

                <Link
                  to={appRoutes.forgotPassword}
                  className="font-semibold text-brand-700 transition hover:text-brand-900"
                >
                  Esqueci minha senha
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Entrando..." : "Entrar no sistema"}
              </button>
            </form>

            <div className="mt-8 rounded-[24px] bg-sand-50 p-4 text-sm text-ink-600">
              Ambiente inicial da FASE 2 pronto para autenticacao, layout base e
              controle de acesso.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

