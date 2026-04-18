import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { maintenanceTicketTypeOptions } from "@imobiliaria/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";
import { useAuth } from "@/features/auth/auth-context";
import { useI18n } from "@/features/preferences/language-provider";
import { requiresMaintenanceEvidence } from "@/lib/maintenance";
import { tenantPortalService } from "@/services/tenant-portal-service";

function createPortalTicketSchema(t: (key: string) => string) {
  return z.object({
    propertyId: z.string().min(1, t("tenantPortal.propertyPlaceholder")),
    type: z.string().min(1, t("tenantPortal.typePlaceholder")),
    description: z
      .string()
      .trim()
      .min(12, t("tenantPortal.descriptionPlaceholder")),
    complementaryNotes: z.string().trim().optional(),
  });
}

type PortalTicketFormValues = z.infer<ReturnType<typeof createPortalTicketSchema>>;

export function TenantPortalTicketNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [files, setFiles] = useState<File[]>([]);
  const portalTicketSchema = useMemo(() => createPortalTicketSchema(t), [t]);

  const overviewQuery = useQuery({
    queryKey: ["tenant-portal-overview"],
    queryFn: () => tenantPortalService.getOverview(accessToken!),
    enabled: Boolean(accessToken),
  });

  const mutation = useMutation({
    mutationFn: (payload: PortalTicketFormValues) =>
      tenantPortalService.openMaintenanceTicket(accessToken!, {
        propertyId: payload.propertyId,
        type: payload.type,
        description: payload.description,
        complementaryNotes: payload.complementaryNotes || null,
        files,
      }),
    onSuccess: async () => {
      toast.success(t("tenantPortal.ticketOpenedSuccess"));
      await queryClient.invalidateQueries({ queryKey: ["tenant-portal-overview"] });
      navigate(-1);
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PortalTicketFormValues>({
    resolver: zodResolver(portalTicketSchema),
    defaultValues: {
      propertyId: "",
      type: "",
      description: "",
      complementaryNotes: "",
    },
  });

  const selectedType = watch("type");
  const propertyOptions = useMemo(
    () =>
      (overviewQuery.data?.contracts ?? []).map((contract) => ({
        value: contract.property.id,
        label: `${contract.property.code} · ${contract.property.title}`,
      })),
    [overviewQuery.data?.contracts],
  );

  const onSubmit = handleSubmit(async (values) => {
    if (requiresMaintenanceEvidence(values.type) && files.length === 0) {
      toast.error(t("tenantPortal.evidenceRequiredError"));
      return;
    }

    await mutation.mutateAsync(values);
  });

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={t("tenantPortal.eyebrow")}
          title={t("tenantPortal.newTicketTitle")}
          description={t("tenantPortal.newTicketDescription")}
        />
        <div className="panel-card skeleton-shimmer h-[420px]" />
      </div>
    );
  }

  if (!overviewQuery.data?.contracts.length) {
    return (
      <EmptyState
        title={t("tenantPortal.newTicketTitle")}
        description={t("tenantPortal.noContracts")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("tenantPortal.eyebrow")}
        title={t("tenantPortal.newTicketTitle")}
        description={t("tenantPortal.newTicketDescription")}
      />

      <SectionCard
        title={t("tenantPortal.openTicketSectionTitle")}
        description={t("tenantPortal.openTicketSectionDescription")}
      >
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormSelect
              label={t("tenantPortal.propertyLabel")}
              options={propertyOptions}
              placeholder={t("tenantPortal.propertyPlaceholder")}
              error={errors.propertyId?.message}
              {...register("propertyId")}
            />
            <FormSelect
              label={t("tenantPortal.typeLabel")}
              options={maintenanceTicketTypeOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              placeholder={t("tenantPortal.typePlaceholder")}
              error={errors.type?.message}
              {...register("type")}
            />
            <div className="md:col-span-2">
              <FormTextarea
                label={t("tenantPortal.descriptionLabel")}
                error={errors.description?.message}
                placeholder={t("tenantPortal.descriptionPlaceholder")}
                {...register("description")}
              />
            </div>
            <div className="md:col-span-2">
              <FormTextarea
                label={t("tenantPortal.notesLabel")}
                placeholder={t("tenantPortal.notesPlaceholder")}
                {...register("complementaryNotes")}
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-dashed border-brand-200 bg-brand-50/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink-950">
                  {t("tenantPortal.evidenceTitle")}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  {selectedType && requiresMaintenanceEvidence(selectedType)
                    ? t("tenantPortal.evidenceRequired")
                    : t("tenantPortal.evidenceOptional")}
                </p>
              </div>
              <label className="secondary-button cursor-pointer">
                {t("tenantPortal.selectFiles")}
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
                    <p className="mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
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
                : t("tenantPortal.newTicket")}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
