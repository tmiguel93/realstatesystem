import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appRoutes, maintenanceTicketTypeOptions } from "@imobiliaria/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";
import { useI18n } from "@/features/preferences/language-provider";
import { buildDetailPath } from "@/lib/format";
import { requiresMaintenanceEvidence } from "@/lib/maintenance";
import { tenantMagicLinkService } from "@/services/tenant-magic-link-service";

function createMagicLinkTicketSchema(t: (key: string) => string) {
  return z.object({
    type: z.string().min(1, t("tenantMagicLink.typeRequired")),
    description: z
      .string()
      .trim()
      .min(12, t("tenantMagicLink.descriptionRequired")),
    complementaryNotes: z.string().trim().optional(),
  });
}

type MagicLinkTicketFormValues = z.infer<
  ReturnType<typeof createMagicLinkTicketSchema>
>;

export function TenantMagicLinkTicketNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token = "" } = useParams();
  const { t } = useI18n();
  const [files, setFiles] = useState<File[]>([]);
  const schema = useMemo(() => createMagicLinkTicketSchema(t), [t]);

  const overviewQuery = useQuery({
    queryKey: ["tenant-magic-link-overview", token],
    queryFn: () => tenantMagicLinkService.getOverview(token),
    enabled: Boolean(token),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (payload: MagicLinkTicketFormValues) =>
      tenantMagicLinkService.openMaintenanceTicket(token, {
        type: payload.type,
        description: payload.description,
        complementaryNotes: payload.complementaryNotes || null,
        files,
      }),
    onSuccess: async () => {
      toast.success(t("tenantMagicLink.ticketOpenedSuccess"));
      await queryClient.invalidateQueries({
        queryKey: ["tenant-magic-link-overview", token],
      });
      navigate(buildDetailPath(appRoutes.tenantMagicLink, token));
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MagicLinkTicketFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "",
      description: "",
      complementaryNotes: "",
    },
  });

  const selectedType = watch("type");

  const onSubmit = handleSubmit(async (values) => {
    if (requiresMaintenanceEvidence(values.type) && files.length === 0) {
      toast.error(t("tenantMagicLink.evidenceRequiredError"));
      return;
    }

    await mutation.mutateAsync(values);
  });

  if (overviewQuery.isLoading) {
    return (
      <main className="min-h-screen bg-[var(--app-bg)] px-6 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <PageHeader
            eyebrow={t("tenantMagicLink.eyebrow")}
            title={t("tenantMagicLink.newTicketTitle")}
            description={t("tenantMagicLink.newTicketDescription")}
          />
          <div className="panel-card skeleton-shimmer h-[420px]" />
        </div>
      </main>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <main className="min-h-screen bg-[var(--app-bg)] px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title={t("tenantMagicLink.invalidTitle")}
            description={t("tenantMagicLink.invalidDescription")}
          />
        </div>
      </main>
    );
  }

  const overview = overviewQuery.data;

  return (
    <main className="min-h-screen bg-[var(--app-bg)] px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          eyebrow={t("tenantMagicLink.eyebrow")}
          title={t("tenantMagicLink.newTicketTitle")}
          description={t("tenantMagicLink.newTicketDescription")}
        />

        <SectionCard
          title={t("tenantMagicLink.ticketFormTitle")}
          description={`${overview.property.code} · ${overview.property.title}`}
        >
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="rounded-[24px] border border-ink-200 bg-[var(--elevated-bg)] px-4 py-4 text-sm text-ink-600">
              {overview.property.addressSummary}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormSelect
                label={t("tenantMagicLink.typeLabel")}
                options={maintenanceTicketTypeOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                placeholder={t("tenantMagicLink.typePlaceholder")}
                error={errors.type?.message}
                {...register("type")}
              />
              <div className="rounded-[24px] border border-brand-200 bg-brand-50/60 px-4 py-4 text-sm text-brand-900">
                {t("tenantMagicLink.ticketScopeNote")}
              </div>
              <div className="md:col-span-2">
                <FormTextarea
                  label={t("tenantMagicLink.descriptionLabel")}
                  error={errors.description?.message}
                  placeholder={t("tenantMagicLink.descriptionPlaceholder")}
                  {...register("description")}
                />
              </div>
              <div className="md:col-span-2">
                <FormTextarea
                  label={t("tenantMagicLink.notesLabel")}
                  placeholder={t("tenantMagicLink.notesPlaceholder")}
                  {...register("complementaryNotes")}
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-dashed border-brand-200 bg-brand-50/50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-950">
                    {t("tenantMagicLink.evidenceTitle")}
                  </p>
                  <p className="mt-1 text-sm text-ink-500">
                    {selectedType && requiresMaintenanceEvidence(selectedType)
                      ? t("tenantMagicLink.evidenceRequired")
                      : t("tenantMagicLink.evidenceOptional")}
                  </p>
                </div>
                <label className="secondary-button cursor-pointer">
                  {t("tenantMagicLink.selectFiles")}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      setFiles(Array.from(event.target.files ?? []));
                    }}
                  />
                </label>
              </div>

              {files.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {files.map((file) => (
                    <div
                      key={`${file.name}-${file.size}`}
                      className="rounded-[20px] border border-ink-200 bg-[var(--elevated-bg)] px-4 py-3 text-sm text-ink-600"
                    >
                      <p className="font-semibold text-ink-900">{file.name}</p>
                      <p className="mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(buildDetailPath(appRoutes.tenantMagicLink, token))}
                className="secondary-button"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="primary-button"
              >
                {mutation.isPending
                  ? `${t("common.loading")}...`
                  : t("tenantMagicLink.openTicket")}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>
    </main>
  );
}
