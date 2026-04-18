import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { appRoutes } from "@imobiliaria/shared";
import { ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/features/preferences/language-provider";
import { authService } from "@/services/auth-service";
import { FormInput } from "@/components/form/form-input";

const forgotPasswordSchema = z.object({
  email: z.string().email("Informe um email valido."),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await authService.forgotPassword(values.email);
    toast.success(result.message);

    if (result.previewToken) {
      toast.info(`Token de desenvolvimento: ${result.previewToken}`);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-mesh px-4 py-8">
      <div className="w-full max-w-xl rounded-[34px] border border-white/10 bg-[#f5f4f0] p-5 shadow-soft md:p-8">
        <div className="rounded-[30px] border border-ink-200 bg-white p-6 shadow-soft md:p-8">
          <div className="inline-flex rounded-2xl bg-brand-50 p-3 text-brand-700">
            <MailCheck size={22} />
          </div>

          <h1 className="mt-5 font-display text-3xl text-ink-950">
            {t("auth.recoveryTitle")}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {t("auth.recoveryDescription")}
          </p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <FormInput
              label={t("auth.emailLabel")}
              type="email"
              placeholder="voce@empresa.com.br"
              error={errors.email?.message}
              {...register("email")}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-ink-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? t("auth.sending") : t("auth.recoverySubmit")}
            </button>
          </form>

          <Link
            to={appRoutes.login}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition hover:text-brand-900"
          >
            <ArrowLeft size={16} />
            {t("auth.backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
