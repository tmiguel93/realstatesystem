import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adjustmentIndexOptions,
  contractOriginOptions,
  guaranteeTypeOptions,
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

function buildDefaults(initialData?: ContractDetail | null): ContractGeneratorFormValues {
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
    legalWarningAcknowledged: false,
  };
}

export function ContractGeneratorForm({
  mode,
  initialData,
  rentLeadOptions,
  propertyOptions,
  tenantOptions,
  pending,
  onSubmit,
}: ContractGeneratorFormProps) {
  const {
    control,
    register,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContractGeneratorFormValues>({
    resolver: zodResolver(contractGeneratorSchema),
    defaultValues: buildDefaults(initialData),
  });

  useEffect(() => {
    reset(buildDefaults(initialData));
  }, [initialData, reset]);

  const originType = watch("originType");

  const submit = handleSubmit(async (values) => {
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
            disabled={pending}
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
