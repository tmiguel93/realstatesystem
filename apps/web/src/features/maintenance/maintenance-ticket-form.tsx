import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  maintenanceTriageDecisionOptions,
  maintenanceTicketTypeOptions,
  maintenanceUrgencyOptions,
  permissionCodes,
} from "@imobiliaria/shared";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";
import { MaintenanceUrgencyBadge } from "@/features/maintenance/maintenance-urgency-badge";
import {
  getMaintenanceUrgencyLabel,
  getMaintenanceTriageDecisionLabel,
  getMaintenanceTriageTone,
  resolveSuggestedUrgency,
  resolveSuggestedTriageDecision,
} from "@/lib/maintenance";
import { useAuth } from "@/features/auth/auth-context";
import { maintenanceService } from "@/services/maintenance-service";
import { propertiesService } from "@/services/properties-service";
import { tenantsService } from "@/services/tenants-service";
import { usersService } from "@/services/users-service";

const attachmentSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do anexo."),
  fileUrl: z.string().trim().url("Informe uma URL valida."),
  mimeType: z.string().trim().min(3, "Informe o tipo do arquivo."),
  sizeBytes: z.string().trim().optional(),
});

const maintenanceTicketFormSchema = z.object({
  propertyId: z.string().uuid("Selecione um imovel."),
  tenantId: z.string().optional(),
  title: z.string().trim().min(4, "Informe um titulo curto."),
  description: z.string().trim().min(12, "Descreva melhor o problema."),
  type: z.string().trim().min(1, "Selecione o tipo."),
  triageDecision: z.string().trim().min(1, "Selecione a triagem inicial."),
  triageNotes: z.string().trim().optional(),
  urgencyLevel: z.string().optional(),
  assignedToUserId: z.string().optional(),
  internalNotes: z.string().trim().optional(),
  attachments: z.array(attachmentSchema),
});

type MaintenanceTicketFormValues = z.infer<
  typeof maintenanceTicketFormSchema
>;

type MaintenanceTicketFormProps = {
  accessToken: string;
  pending?: boolean;
  onSubmit: (values: {
    propertyId: string;
    tenantId?: string | null;
    title: string;
    description: string;
    type: string;
    triageDecision?: string | null;
    triageNotes?: string | null;
    urgencyLevel?: number | null;
    assignedToUserId?: string | null;
    internalNotes?: string | null;
    attachments: Array<{
      name: string;
      fileUrl: string;
      mimeType: string;
      sizeBytes: number;
    }>;
  }) => Promise<void>;
};

export function MaintenanceTicketForm({
  accessToken,
  pending,
  onSubmit,
}: MaintenanceTicketFormProps) {
  const { hasPermission } = useAuth();
  const allowOverride = hasPermission(permissionCodes.MAINTENANCE_OVERRIDE);
  const [propertySearch, setPropertySearch] = useState("");
  const deferredPropertySearch = useDeferredValue(propertySearch);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MaintenanceTicketFormValues>({
    resolver: zodResolver(maintenanceTicketFormSchema),
    defaultValues: {
      propertyId: "",
      tenantId: "",
      title: "",
      description: "",
      type: "CORRECTIVE",
      triageDecision: "INTERNAL_REPAIR",
      triageNotes: "",
      urgencyLevel: "",
      assignedToUserId: "",
      internalNotes: "",
      attachments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "attachments",
  });

  const propertyId = watch("propertyId");
  const selectedType = watch("type");
  const selectedTriageDecision = watch("triageDecision");
  const suggestedUrgency = resolveSuggestedUrgency(selectedType);
  const suggestedTriageDecision = resolveSuggestedTriageDecision(selectedType);

  const propertiesQuery = useQuery({
    queryKey: ["maintenance-form-properties", deferredPropertySearch],
    queryFn: () =>
      propertiesService.list({
        accessToken,
        page: 1,
        pageSize: 20,
        search: deferredPropertySearch || undefined,
      }),
    enabled: Boolean(accessToken),
    placeholderData: (previousData) => previousData,
  });

  const propertyContextQuery = useQuery({
    queryKey: ["maintenance-property-context", propertyId],
    queryFn: () =>
      maintenanceService.getPropertyContext(accessToken, {
        propertyId,
      }),
    enabled: Boolean(accessToken && propertyId),
  });

  const assignableUsersQuery = useQuery({
    queryKey: ["maintenance-assignable-users"],
    queryFn: () => usersService.listAssignable(accessToken),
    enabled: Boolean(accessToken),
  });

  const tenantsQuery = useQuery({
    queryKey: ["maintenance-tenants"],
    queryFn: () =>
      tenantsService.list({
        accessToken,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(accessToken && allowOverride),
  });

  useEffect(() => {
    setValue("triageDecision", suggestedTriageDecision);
  }, [setValue, suggestedTriageDecision]);

  useEffect(() => {
    if (!propertyContextQuery.data?.activeTenant) {
      if (!allowOverride) {
        setValue("tenantId", "");
      }
      return;
    }

    setValue("tenantId", propertyContextQuery.data.activeTenant.id);
  }, [allowOverride, propertyContextQuery.data, setValue]);

  const propertyOptions = useMemo(
    () =>
      (propertiesQuery.data?.data ?? []).map((property) => ({
        value: property.id,
        label: `${property.code} - ${property.title}`,
      })),
    [propertiesQuery.data],
  );

  const tenantOptions = useMemo(
    () => [
      { value: "", label: "Sem locatario vinculado" },
      ...((tenantsQuery.data?.data ?? []).map((tenant) => ({
        value: tenant.id,
        label: tenant.fullName,
      })) ?? []),
    ],
    [tenantsQuery.data],
  );

  const responsibleOptions = useMemo(
    () => [
      { value: "", label: "Sem responsavel definido" },
      ...((assignableUsersQuery.data ?? []).map((user) => ({
        value: user.id,
        label: user.fullName,
      })) ?? []),
    ],
    [assignableUsersQuery.data],
  );

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      propertyId: values.propertyId,
      tenantId: values.tenantId ? values.tenantId : null,
      title: values.title,
      description: values.description,
      type: values.type,
      triageDecision: values.triageDecision || null,
      triageNotes: values.triageNotes?.trim() ? values.triageNotes : null,
      urgencyLevel:
        allowOverride && values.urgencyLevel
          ? Number(values.urgencyLevel)
          : null,
      assignedToUserId: values.assignedToUserId || null,
      internalNotes: values.internalNotes?.trim() ? values.internalNotes : null,
      attachments: values.attachments.map((attachment) => ({
        name: attachment.name,
        fileUrl: attachment.fileUrl,
        mimeType: attachment.mimeType,
        sizeBytes: Number(attachment.sizeBytes || 0),
      })),
    });
  });

  return (
    <form className="space-y-6" onSubmit={submit}>
      <section className="panel-card">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-4">
            <FormInput
              label="Pesquisar imovel por ID cadastral ou titulo"
              placeholder="Ex.: IMV-2026-001 ou cobertura centro"
              value={propertySearch}
              onChange={(event) => setPropertySearch(event.target.value)}
            />
            <FormSelect
              label="Imovel vinculado"
              options={propertyOptions}
              placeholder={
                propertiesQuery.isLoading
                  ? "Carregando imoveis..."
                  : "Selecione o imovel localizado"
              }
              error={errors.propertyId?.message}
              {...register("propertyId")}
            />

            {!propertiesQuery.isLoading && propertyOptions.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                Nenhum imovel cadastrado foi encontrado. Cadastre pelo menos um imovel na base antes de abrir um chamado.
              </div>
            ) : null}
          </div>

          <div className="panel-card-muted px-4 py-4">
            <p className="text-xs uppercase tracking-[0.24em] text-brand-600">
              Contexto automatico
            </p>
            {propertyContextQuery.data ? (
              <div className="mt-4 space-y-3 text-sm text-ink-700">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-400">
                    Proprietario
                  </p>
                  <p className="mt-1 font-semibold text-ink-950">
                    {propertyContextQuery.data.owner.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-400">
                    Locatario atual
                  </p>
                  <p className="mt-1 font-semibold text-ink-950">
                    {propertyContextQuery.data.activeTenant?.fullName ??
                      "Sem contrato ativo"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-400">
                    Endereco resumido
                  </p>
                  <p className="mt-1 font-semibold text-ink-950">
                    {propertyContextQuery.data.property.addressSummary}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink-500">
                Selecione um imovel para preencher proprietario, locatario atual e endereco resumido.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormInput
              label="Titulo / resumo curto"
              placeholder="Ex.: Vazamento no banheiro social"
              error={errors.title?.message}
              {...register("title")}
            />
          </div>

          <FormSelect
            label="Categoria do chamado"
            options={maintenanceTicketTypeOptions.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
            error={errors.type?.message}
            {...register("type")}
          />

          <div className="rounded-[24px] border border-ink-200/80 bg-white/90 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
            <p className="text-sm font-semibold text-ink-700">
              Urgencia automatica sugerida
            </p>
            <div className="mt-3 flex items-center gap-3">
              <MaintenanceUrgencyBadge urgencyLevel={suggestedUrgency} />
              <p className="text-sm text-ink-500">
                {getMaintenanceUrgencyLabel(suggestedUrgency)}
              </p>
            </div>
          </div>

          <div className="md:col-span-2 rounded-[28px] border border-brand-100 bg-brand-50/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Triagem inicial sugerida
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  O sistema sugere uma classificação operacional com base na categoria e na urgência.
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getMaintenanceTriageTone(selectedTriageDecision)}`}
              >
                {getMaintenanceTriageDecisionLabel(selectedTriageDecision)}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {maintenanceTriageDecisionOptions.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-[22px] border px-4 py-3 text-sm font-semibold transition ${
                    selectedTriageDecision === option.value
                      ? getMaintenanceTriageTone(option.value)
                      : "border-ink-200 bg-white text-ink-600 hover:border-brand-200"
                  }`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    className="sr-only"
                    {...register("triageDecision")}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {errors.triageDecision?.message ? (
              <p className="mt-2 text-sm text-rose-600">
                {errors.triageDecision.message}
              </p>
            ) : null}
          </div>

          {allowOverride ? (
            <FormSelect
              label="Override manual de urgencia"
              options={[
                { value: "", label: "Manter regra automatica" },
                ...maintenanceUrgencyOptions.map((item) => ({
                  value: item.value,
                  label: item.label,
                })),
              ]}
              {...register("urgencyLevel")}
            />
          ) : null}

          <FormSelect
            label="Responsavel"
            options={responsibleOptions}
            {...register("assignedToUserId")}
          />

          {allowOverride ? (
            <FormSelect
              label="Locatario ajustado manualmente"
              options={tenantOptions}
              {...register("tenantId")}
            />
          ) : (
            <div className="panel-card-muted px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400">
                Locatario vinculado
              </p>
              <p className="mt-2 text-sm font-semibold text-ink-950">
                {propertyContextQuery.data?.activeTenant?.fullName ??
                  "Sem locatario vinculado"}
              </p>
            </div>
          )}

          <div className="md:col-span-2">
            <FormTextarea
              label="Descricao detalhada"
              placeholder="Explique o problema, impacto operacional, ambiente afetado e qualquer observacao importante."
              error={errors.description?.message}
              {...register("description")}
            />
          </div>
          <div className="md:col-span-2">
            <FormTextarea
              label="Observacoes internas"
              placeholder="Notas administrativas, orientacoes de triagem ou contexto adicional."
              {...register("internalNotes")}
            />
          </div>
          <div className="md:col-span-2">
            <FormTextarea
              label="Observação da triagem"
              placeholder="Explique em uma frase o motivo da classificação, se houver."
              {...register("triageNotes")}
            />
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-2xl text-ink-950">
              Anexos e fotos
            </p>
            <p className="mt-1 text-sm text-ink-500">
              Estrutura inicial pronta para links de imagens, laudos ou arquivos externos.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              append({
                name: "",
                fileUrl: "",
                mimeType: "image/jpeg",
                sizeBytes: "",
              })
            }
            className="secondary-button"
          >
            Adicionar anexo
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {fields.length ? (
            fields.map((field, index) => (
              <div
                key={field.id}
                className="panel-card-muted grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_160px_140px_auto]"
              >
                <FormInput
                  label="Nome"
                  error={errors.attachments?.[index]?.name?.message}
                  {...register(`attachments.${index}.name`)}
                />
                <FormInput
                  label="URL do arquivo"
                  error={errors.attachments?.[index]?.fileUrl?.message}
                  {...register(`attachments.${index}.fileUrl`)}
                />
                <FormInput
                  label="Mime type"
                  error={errors.attachments?.[index]?.mimeType?.message}
                  {...register(`attachments.${index}.mimeType`)}
                />
                <FormInput
                  label="Tamanho (bytes)"
                  error={errors.attachments?.[index]?.sizeBytes?.message}
                  {...register(`attachments.${index}.sizeBytes`)}
                />
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="secondary-button w-full"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="panel-card-muted px-4 py-4 text-sm text-ink-500">
              Nenhum anexo informado por enquanto.
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || propertyOptions.length === 0}
          className="primary-button min-w-[220px] disabled:opacity-60"
        >
          {pending
            ? "Abrindo chamado..."
            : propertyOptions.length === 0
              ? "Cadastre um imovel primeiro"
              : "Abrir chamado"}
        </button>
      </div>
    </form>
  );
}
