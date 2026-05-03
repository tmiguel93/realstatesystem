import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adjustmentIndexOptions,
  contractChecklistItemTypeOptions,
  contractChecklistStatusOptions,
  contractOriginOptions,
  guaranteeTypeOptions,
  requiredContractChecklistItemTypes,
} from "@imobiliaria/shared";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormSwitch } from "@/components/form/form-switch";
import { FormTextarea } from "@/components/form/form-textarea";
import { SectionCard } from "@/components/feedback/section-card";
import type { ContractDetail } from "@/types/domain";

const DEFAULT_RESPONSIBILITIES_TEXT = [
  "Pagar aluguel e encargos convencionados nos prazos ajustados.",
  "Utilizar o imovel exclusivamente para destinacao residencial, salvo ajuste escrito em contrario.",
  "Comunicar ocorrencias relevantes e necessidades de reparo sem atraso indevido.",
  "Zelar pela conservacao do imovel e devolve-lo conforme as condicoes pactuadas e a vistoria.",
].join("\n");

const mandatoryChecklistTypes = new Set<string>([
  "DOCUMENTS",
  "DUE_DAY",
  "APPROVAL",
]);

const contractChecklistSchema = z.object({
  itemType: z.string().trim().min(1),
  status: z.string().trim().min(1),
  isRequired: z.boolean(),
  responsibleUserId: z.string().trim().optional(),
  completedAt: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  attachmentFileUrl: z.string().trim().optional(),
});

const contractGeneratorSchema = z
  .object({
    code: z.string().trim().optional(),
    originType: z.string().trim().min(1, "Selecione a origem contratual."),
    rentLeadId: z.string().trim().optional(),
    propertyId: z.string().trim().optional(),
    tenantId: z.string().trim().optional(),
    startDate: z.string().trim().min(1, "Informe a data inicial."),
    endDate: z.string().trim().min(1, "Informe a data final."),
    rentAmount: z.string().trim().min(1, "Informe o valor do aluguel."),
    dueDay: z.string().trim().min(1, "Informe o dia de vencimento."),
    guaranteeType: z.string().trim().min(1, "Selecione a garantia."),
    guaranteeDetails: z.string().trim().optional(),
    adjustmentIndex: z.string().trim().min(1, "Selecione o indice."),
    adjustmentFrequencyMonths: z
      .string()
      .trim()
      .min(1, "Informe a frequencia do reajuste."),
    lateFeePercentage: z.string().trim().optional(),
    penaltyDescription: z.string().trim().optional(),
    responsibilitiesText: z.string().trim().optional(),
    additionalClauses: z.string().trim().optional(),
    checklistItems: z.array(contractChecklistSchema),
    checklistOverrideReason: z.string().trim().optional(),
    legalWarningAcknowledged: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.originType === "RENT_PIPELINE" && !value.rentLeadId?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rentLeadId"],
        message: "Selecione o lead do pipeline.",
      });
    }

    if (value.originType === "MANUAL") {
      if (!value.propertyId?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["propertyId"],
          message: "Selecione o imovel.",
        });
      }

      if (!value.tenantId?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tenantId"],
          message: "Selecione o locatario.",
        });
      }
    }

    const startDate = new Date(`${value.startDate}T12:00:00`);
    const endDate = new Date(`${value.endDate}T12:00:00`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Preencha datas validas.",
      });
    } else if (endDate <= startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "A data final deve ser posterior a inicial.",
      });
    }

    const rentAmount = Number(value.rentAmount.replace(",", "."));
    if (Number.isNaN(rentAmount) || rentAmount <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rentAmount"],
        message: "Informe um valor de aluguel valido.",
      });
    }

    const dueDay = Number(value.dueDay);
    if (Number.isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueDay"],
        message: "O vencimento deve estar entre 1 e 31.",
      });
    }

    const frequency = Number(value.adjustmentFrequencyMonths);
    if (Number.isNaN(frequency) || frequency < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adjustmentFrequencyMonths"],
        message: "Informe uma frequencia valida.",
      });
    }

    const lateFee = value.lateFeePercentage?.trim() ?? "";
    if (lateFee) {
      const feeValue = Number(lateFee.replace(",", "."));
      if (Number.isNaN(feeValue) || feeValue < 0 || feeValue > 100) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lateFeePercentage"],
          message: "A multa deve ficar entre 0 e 100.",
        });
      }
    }

    if (!value.legalWarningAcknowledged) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["legalWarningAcknowledged"],
        message: "Confirme a validacao juridica obrigatoria da minuta.",
      });
    }
  });

type ContractGeneratorFormValues = z.infer<typeof contractGeneratorSchema>;

type ContractGeneratorFormProps = {
  mode: "create" | "version";
  initialData?: ContractDetail | null;
  rentLeadOptions: Array<{ value: string; label: string }>;
  propertyOptions: Array<{ value: string; label: string }>;
  tenantOptions: Array<{ value: string; label: string }>;
  responsibleOptions: Array<{ value: string; label: string }>;
  currentUserId?: string | null;
  canOverrideChecklist?: boolean;
  pending?: boolean;
  onSubmit: (payload: {
    code?: string | null;
    originType: string;
    rentLeadId?: string | null;
    propertyId?: string | null;
    tenantId?: string | null;
    startDate: string;
    endDate: string;
    rentAmount: number;
    dueDay: number;
    guaranteeType: string;
    guaranteeDetails?: string | null;
    adjustmentIndex: string;
    adjustmentFrequencyMonths: number;
    lateFeePercentage?: number | null;
    penaltyDescription?: string | null;
    responsibilities: string[];
    additionalClauses?: string | null;
    checklistItems: Array<{
      itemType: string;
      status: string;
      isRequired: boolean;
      responsibleUserId?: string | null;
      completedAt?: string | null;
      notes?: string | null;
      attachmentFileUrl?: string | null;
    }>;
    checklistOverrideReason?: string | null;
    legalWarningAcknowledged: boolean;
  }) => Promise<void>;
};

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function toNullable(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function toNullableNumber(value?: string) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const numberValue = Number(normalized.replace(",", "."));
  return Number.isNaN(numberValue) ? null : numberValue;
}

function toIsoDate(value: string) {
  return new Date(`${value}T12:00:00`).toISOString();
}

function buildDefaultChecklistItems(
  initialData?: ContractDetail | null,
  currentUserId?: string | null,
) {
  return requiredContractChecklistItemTypes.map((itemType) => {
    const existing = initialData?.checklistItems.find(
      (item) => item.itemType === itemType,
    );

    return {
      itemType,
      status: existing?.status ?? "PENDING",
      isRequired: existing?.isRequired ?? true,
      responsibleUserId: existing?.responsibleUserId ?? currentUserId ?? "",
      completedAt: existing?.completedAt ?? "",
      notes: existing?.notes ?? "",
      attachmentFileUrl: existing?.attachmentFileUrl ?? "",
    };
  });
}

function buildDefaults(
  initialData?: ContractDetail | null,
  currentUserId?: string | null,
): ContractGeneratorFormValues {
  return {
    code: initialData?.code ?? "",
    originType: initialData?.originType ?? "RENT_PIPELINE",
    rentLeadId: initialData?.rentLead?.id ?? "",
    propertyId: initialData?.property.id ?? "",
    tenantId: initialData?.tenant.id ?? "",
    startDate: toDateInputValue(initialData?.startDate),
    endDate: toDateInputValue(initialData?.endDate),
    rentAmount:
      initialData?.rentAmount !== undefined ? String(initialData.rentAmount) : "",
    dueDay: initialData?.dueDay ? String(initialData.dueDay) : "10",
    guaranteeType: initialData?.guaranteeType ?? "NONE",
    guaranteeDetails: initialData?.guaranteeDetails ?? "",
    adjustmentIndex: initialData?.adjustmentIndex ?? "IPCA",
    adjustmentFrequencyMonths: initialData?.adjustmentFrequencyMonths
      ? String(initialData.adjustmentFrequencyMonths)
      : "12",
    lateFeePercentage:
      initialData?.lateFeePercentage !== null &&
      initialData?.lateFeePercentage !== undefined
        ? String(initialData.lateFeePercentage)
        : "2",
    penaltyDescription: initialData?.penaltyDescription ?? "",
    responsibilitiesText:
      initialData?.responsibilities.join("\n") ?? DEFAULT_RESPONSIBILITIES_TEXT,
    additionalClauses: initialData?.additionalClauses ?? "",
    checklistItems: buildDefaultChecklistItems(initialData, currentUserId),
    checklistOverrideReason: "",
    legalWarningAcknowledged: false,
  };
}

export function ContractGeneratorForm({
  mode,
  initialData,
  rentLeadOptions,
  propertyOptions,
  tenantOptions,
  responsibleOptions,
  currentUserId,
  canOverrideChecklist = false,
  pending,
  onSubmit,
}: ContractGeneratorFormProps) {
  const {
    control,
    register,
    watch,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContractGeneratorFormValues>({
    resolver: zodResolver(contractGeneratorSchema),
    defaultValues: buildDefaults(initialData, currentUserId),
  });

  useEffect(() => {
    reset(buildDefaults(initialData, currentUserId));
  }, [currentUserId, initialData, reset]);

  const originType = watch("originType");
  const checklistItems = watch("checklistItems");
  const checklistOverrideReason = watch("checklistOverrideReason");
  const checklistBlockers = useMemo(
    () =>
      checklistItems.filter((item) => {
        if (!item.isRequired) {
          return false;
        }

        if (mandatoryChecklistTypes.has(item.itemType)) {
          return item.status !== "APPROVED";
        }

        return !["APPROVED", "NOT_APPLICABLE"].includes(item.status);
      }),
    [checklistItems],
  );
  const checklistProgress = useMemo(() => {
    if (!checklistItems.length) {
      return 0;
    }

    return Math.round(
      ((checklistItems.length - checklistBlockers.length) / checklistItems.length) *
        100,
    );
  }, [checklistBlockers.length, checklistItems.length]);

  const submit = handleSubmit(async (values) => {
    const blockers = values.checklistItems.filter((item) => {
      if (!item.isRequired) {
        return false;
      }

      if (mandatoryChecklistTypes.has(item.itemType)) {
        return item.status !== "APPROVED";
      }

      return !["APPROVED", "NOT_APPLICABLE"].includes(item.status);
    });

    if (blockers.length && !canOverrideChecklist) {
      setError("checklistItems", {
        type: "manual",
        message: "Conclua o checklist obrigatório antes de gerar a minuta.",
      });
      return;
    }

    if (
      blockers.length &&
      canOverrideChecklist &&
      !values.checklistOverrideReason?.trim()
    ) {
      setError("checklistOverrideReason", {
        type: "manual",
        message: "Informe a justificativa da exceção.",
      });
      return;
    }

    const now = new Date().toISOString();

    await onSubmit({
      code: toNullable(values.code),
      originType: values.originType,
      rentLeadId:
        values.originType === "RENT_PIPELINE" ? toNullable(values.rentLeadId) : null,
      propertyId:
        values.originType === "MANUAL" ? toNullable(values.propertyId) : null,
      tenantId:
        values.originType === "MANUAL" ? toNullable(values.tenantId) : null,
      startDate: toIsoDate(values.startDate),
      endDate: toIsoDate(values.endDate),
      rentAmount: Number(values.rentAmount.replace(",", ".")),
      dueDay: Number(values.dueDay),
      guaranteeType: values.guaranteeType,
      guaranteeDetails: toNullable(values.guaranteeDetails),
      adjustmentIndex: values.adjustmentIndex,
      adjustmentFrequencyMonths: Number(values.adjustmentFrequencyMonths),
      lateFeePercentage: toNullableNumber(values.lateFeePercentage),
      penaltyDescription: toNullable(values.penaltyDescription),
      responsibilities: (values.responsibilitiesText || DEFAULT_RESPONSIBILITIES_TEXT)
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      additionalClauses: toNullable(values.additionalClauses),
      checklistItems: values.checklistItems.map((item) => {
        const completed = ["APPROVED", "NOT_APPLICABLE"].includes(item.status);

        return {
          itemType: item.itemType,
          status: item.status,
          isRequired: item.isRequired,
          responsibleUserId: toNullable(item.responsibleUserId),
          completedAt: completed ? item.completedAt || now : null,
          notes: toNullable(item.notes),
          attachmentFileUrl: toNullable(item.attachmentFileUrl),
        };
      }),
      checklistOverrideReason:
        blockers.length && canOverrideChecklist
          ? toNullable(values.checklistOverrideReason)
          : null,
      legalWarningAcknowledged: values.legalWarningAcknowledged,
    });
  });

  const isPipelineOrigin = originType === "RENT_PIPELINE";

  return (
    <form className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]" onSubmit={submit}>
      <SectionCard
        title={mode === "version" ? "Nova versao da minuta" : "Dados da minuta"}
        description="Preencha os parametros comerciais da locacao e confirme a revisao juridica antes de gerar o documento."
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Codigo do contrato" {...register("code")} />
            <FormSelect
              label="Origem"
              options={contractOriginOptions.map((option: { value: string; label: string }) => ({
                value: option.value,
                label: option.label,
              }))}
              error={errors.originType?.message}
              disabled={mode === "version"}
              {...register("originType")}
            />
            {isPipelineOrigin ? (
              <div className="md:col-span-2">
                <FormSelect
                  label="Lead de locacao"
                  options={rentLeadOptions}
                  placeholder="Selecione o lead vinculado"
                  error={errors.rentLeadId?.message}
                  disabled={mode === "version"}
                  {...register("rentLeadId")}
                />
              </div>
            ) : (
              <>
                <FormSelect
                  label="Imovel"
                  options={propertyOptions}
                  placeholder="Selecione o imovel"
                  error={errors.propertyId?.message}
                  {...register("propertyId")}
                />
                <FormSelect
                  label="Locatario"
                  options={tenantOptions}
                  placeholder="Selecione o locatario"
                  error={errors.tenantId?.message}
                  {...register("tenantId")}
                />
              </>
            )}
            <FormInput
              label="Inicio da locacao"
              type="date"
              error={errors.startDate?.message}
              {...register("startDate")}
            />
            <FormInput
              label="Fim da locacao"
              type="date"
              error={errors.endDate?.message}
              {...register("endDate")}
            />
            <FormInput
              label="Aluguel mensal"
              error={errors.rentAmount?.message}
              {...register("rentAmount")}
            />
            <FormInput
              label="Dia de vencimento"
              error={errors.dueDay?.message}
              {...register("dueDay")}
            />
            <FormSelect
              label="Garantia"
              options={guaranteeTypeOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              error={errors.guaranteeType?.message}
              {...register("guaranteeType")}
            />
            <FormInput
              label="Detalhes da garantia"
              {...register("guaranteeDetails")}
            />
            <FormSelect
              label="Indice de reajuste"
              options={adjustmentIndexOptions.map((option: { value: string; label: string }) => ({
                value: option.value,
                label: option.label,
              }))}
              error={errors.adjustmentIndex?.message}
              {...register("adjustmentIndex")}
            />
            <FormInput
              label="Reajuste a cada quantos meses"
              error={errors.adjustmentFrequencyMonths?.message}
              {...register("adjustmentFrequencyMonths")}
            />
            <FormInput
              label="Multa por atraso (%)"
              error={errors.lateFeePercentage?.message}
              {...register("lateFeePercentage")}
            />
            <FormInput
              label="Descricao resumida da penalidade"
              {...register("penaltyDescription")}
            />
          </div>

          <FormTextarea
            label="Responsabilidades operacionais (uma por linha)"
            error={errors.responsibilitiesText?.message}
            {...register("responsibilitiesText")}
          />
          <FormTextarea
            label="Clausulas adicionais"
            {...register("additionalClauses")}
          />
        </div>
      </SectionCard>

      <div className="space-y-5">
        <SectionCard
          title="Checklist obrigatório"
          description="A geração só avança quando todos os itens obrigatórios estão aprovados ou quando uma exceção autorizada é justificada."
        >
          <div className="mb-5 rounded-[24px] border border-brand-100 bg-brand-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Progresso do checklist
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  {checklistBlockers.length
                    ? `${checklistBlockers.length} pendência(s) obrigatória(s)`
                    : "Pronto para gerar a minuta"}
                </p>
              </div>
              <span className="font-display text-3xl text-ink-950">
                {checklistProgress}%
              </span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white">
              <div
                className="h-2 rounded-full bg-brand-600 transition-all duration-300"
                style={{ width: `${checklistProgress}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {checklistItems.map((item, index) => {
              const option = contractChecklistItemTypeOptions.find(
                (entry) => entry.value === item.itemType,
              );
              const blocked = checklistBlockers.some(
                (blocker) => blocker.itemType === item.itemType,
              );

              return (
                <article
                  key={item.itemType}
                  className={`rounded-[24px] border px-4 py-4 transition ${
                    blocked
                      ? "border-amber-200 bg-amber-50/70"
                      : "border-emerald-200 bg-emerald-50/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-950">
                        {option?.label ?? item.itemType}
                      </p>
                      <p className="mt-1 text-xs text-ink-500">
                        {item.isRequired ? "Obrigatório" : "Opcional"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                        blocked
                          ? "bg-white text-amber-800"
                          : "bg-white text-emerald-700"
                      }`}
                    >
                      {blocked ? "Pendente" : "OK"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <input
                      type="hidden"
                      {...register(`checklistItems.${index}.itemType`)}
                    />
                    <FormSelect
                      label="Status"
                      options={contractChecklistStatusOptions.map((status) => ({
                        value: status.value,
                        label: status.label,
                      }))}
                      {...register(`checklistItems.${index}.status`)}
                    />
                    <FormSelect
                      label="Responsável"
                      options={[
                        { value: "", label: "Sem responsável" },
                        ...responsibleOptions,
                      ]}
                      {...register(`checklistItems.${index}.responsibleUserId`)}
                    />
                    <FormInput
                      label="Anexo opcional"
                      placeholder="URL do documento ou evidência"
                      {...register(`checklistItems.${index}.attachmentFileUrl`)}
                    />
                    <FormTextarea
                      label="Observação"
                      placeholder="Contexto curto da conferência."
                      {...register(`checklistItems.${index}.notes`)}
                    />
                  </div>
                </article>
              );
            })}
          </div>

          {errors.checklistItems?.message ? (
            <p className="mt-4 text-sm text-rose-600">
              {errors.checklistItems.message}
            </p>
          ) : null}

          {checklistBlockers.length && canOverrideChecklist ? (
            <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4">
              <FormTextarea
                label="Justificativa de exceção"
                placeholder="Explique por que a minuta precisa ser gerada mesmo com pendências."
                error={errors.checklistOverrideReason?.message}
                {...register("checklistOverrideReason")}
              />
              <p className="mt-2 text-xs text-amber-800">
                A exceção será registrada em auditoria e vinculada ao contrato.
              </p>
            </div>
          ) : null}

          {checklistBlockers.length && !canOverrideChecklist ? (
            <div className="mt-5 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
              Você não possui permissão para gerar com exceção. Conclua os itens pendentes ou solicite revisão superior.
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Aviso obrigatorio"
          description="A minuta e um apoio operacional. O uso final exige validacao juridica antes da assinatura."
        >
          <Controller
            control={control}
            name="legalWarningAcknowledged"
            render={({ field }) => (
              <div className="space-y-3">
                <FormSwitch
                  label="Confirmo a revisao juridica obrigatoria"
                  description="O sistema nao promete conformidade juridica final automatica."
                  checked={field.value}
                  onChange={field.onChange}
                />
                {errors.legalWarningAcknowledged?.message ? (
                  <p className="text-sm text-rose-600">
                    {errors.legalWarningAcknowledged.message}
                  </p>
                ) : null}
              </div>
            )}
          />
        </SectionCard>

        <SectionCard
          title="O que entra automaticamente"
          description="Os campos abaixo sao combinados com os cadastros da base para montar a versao renderizada."
        >
          <div className="space-y-3 text-sm text-ink-600">
            <p>Locador e imovel sao preenchidos pelos relacionamentos cadastrados.</p>
            <p>Locatario e lead comercial entram automaticamente quando houver vinculo operacional.</p>
            <p>O PDF exportado nasce da versao escolhida e preserva o versionamento interno.</p>
          </div>
        </SectionCard>

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={
              pending ||
              (checklistBlockers.length > 0 &&
                (!canOverrideChecklist || !checklistOverrideReason?.trim()))
            }
            className="primary-button disabled:opacity-60"
          >
            {pending
              ? "Gerando..."
              : mode === "version"
                ? "Salvar nova versao"
                : "Gerar contrato"}
          </button>
        </div>
      </div>
    </form>
  );
}
