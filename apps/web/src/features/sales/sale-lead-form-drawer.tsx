import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  leadSourceOptions,
  leadStatusOptions,
  saleLeadStageOptions,
} from "@imobiliaria/shared";
import { Drawer } from "@/components/layout/drawer";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";
import { toDateTimeLocalValue } from "@/lib/format";
import type { SaleLeadDetail, SaleLeadListItem } from "@/types/domain";

const saleLeadSchema = z.object({
  code: z.string().trim().optional(),
  pipelineStage: z.string().trim().min(1, "Selecione a etapa."),
  status: z.string().trim().min(1, "Selecione o status."),
  source: z.string().trim().optional(),
  customerName: z.string().trim().min(3, "Informe o nome do cliente."),
  customerEmail: z.string().trim().optional(),
  customerPhone: z.string().trim().optional(),
  customerDocument: z.string().trim().optional(),
  desiredRegion: z.string().trim().optional(),
  budgetMin: z.string().trim().optional(),
  budgetMax: z.string().trim().optional(),
  lastContactAt: z.string().trim().optional(),
  nextFollowUpAt: z.string().trim().optional(),
  propertyId: z.string().trim().optional(),
  responsibleUserId: z.string().trim().min(1, "Selecione o responsavel."),
  notes: z.string().trim().optional(),
  lossReason: z.string().trim().optional(),
});

type SaleLeadFormValues = z.infer<typeof saleLeadSchema>;

type SaleLeadFormDrawerProps = {
  open: boolean;
  responsibleOptions: Array<{ value: string; label: string }>;
  propertyOptions: Array<{ value: string; label: string }>;
  initialData?: SaleLeadDetail | SaleLeadListItem | null;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: {
    code?: string | null;
    pipelineStage: string;
    status: string;
    source?: string | null;
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    customerDocument?: string | null;
    desiredRegion?: string | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
    lastContactAt?: string | null;
    nextFollowUpAt?: string | null;
    propertyId?: string | null;
    responsibleUserId: string;
    notes?: string | null;
    lossReason?: string | null;
  }) => Promise<void>;
};

function toNullable(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function toIsoOrNull(value?: string) {
  const normalized = toNullable(value);
  return normalized ? new Date(normalized).toISOString() : null;
}

function toNullableNumber(value?: string) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const numberValue = Number(normalized.replace(",", "."));
  return Number.isNaN(numberValue) ? null : numberValue;
}

function buildDefaults(initialData?: SaleLeadDetail | SaleLeadListItem | null): SaleLeadFormValues {
  const detailData = initialData as SaleLeadDetail | null | undefined;

  return {
    code: initialData?.code ?? "",
    pipelineStage: initialData?.pipelineStage ?? "NEW_LEAD",
    status: initialData?.status ?? "OPEN",
    source: initialData?.source ?? "",
    customerName: initialData?.customerName ?? "",
    customerEmail: initialData?.customerEmail ?? "",
    customerPhone: initialData?.customerPhone ?? "",
    customerDocument: detailData?.customerDocument ?? "",
    desiredRegion: initialData?.desiredRegion ?? "",
    budgetMin: initialData?.budgetMin !== null ? String(initialData?.budgetMin ?? "") : "",
    budgetMax: initialData?.budgetMax !== null ? String(initialData?.budgetMax ?? "") : "",
    lastContactAt: toDateTimeLocalValue(initialData?.lastContactAt),
    nextFollowUpAt: toDateTimeLocalValue(initialData?.nextFollowUpAt),
    propertyId: initialData?.property?.id ?? "",
    responsibleUserId: initialData?.responsibleUser.id ?? "",
    notes: detailData?.notes ?? "",
    lossReason: detailData?.lossReason ?? "",
  };
}

export function SaleLeadFormDrawer({
  open,
  responsibleOptions,
  propertyOptions,
  initialData,
  pending,
  onClose,
  onSubmit,
}: SaleLeadFormDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SaleLeadFormValues>({
    resolver: zodResolver(saleLeadSchema),
    defaultValues: buildDefaults(initialData),
  });

  useEffect(() => {
    reset(buildDefaults(initialData));
  }, [initialData, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      code: toNullable(values.code),
      pipelineStage: values.pipelineStage,
      status: values.status,
      source: toNullable(values.source),
      customerName: values.customerName,
      customerEmail: toNullable(values.customerEmail),
      customerPhone: toNullable(values.customerPhone),
      customerDocument: toNullable(values.customerDocument),
      desiredRegion: toNullable(values.desiredRegion),
      budgetMin: toNullableNumber(values.budgetMin),
      budgetMax: toNullableNumber(values.budgetMax),
      lastContactAt: toIsoOrNull(values.lastContactAt),
      nextFollowUpAt: toIsoOrNull(values.nextFollowUpAt),
      propertyId: toNullable(values.propertyId),
      responsibleUserId: values.responsibleUserId,
      notes: toNullable(values.notes),
      lossReason: toNullable(values.lossReason),
    });
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initialData ? "Editar lead de venda" : "Novo lead de venda"}
      description="Conduza o pipeline comercial com etapa, follow-up, responsavel e imovel vinculado."
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="sale-lead-form"
            disabled={pending}
            className="rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar lead"}
          </button>
        </div>
      }
    >
      <form id="sale-lead-form" className="space-y-6" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Codigo" {...register("code")} />
          <FormSelect
            label="Origem"
            options={leadSourceOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            placeholder="Selecione a origem"
            {...register("source")}
          />
          <div className="md:col-span-2">
            <FormInput
              label="Cliente interessado"
              error={errors.customerName?.message}
              {...register("customerName")}
            />
          </div>
          <FormInput label="Email" {...register("customerEmail")} />
          <FormInput label="Telefone" {...register("customerPhone")} />
          <FormInput label="Documento" {...register("customerDocument")} />
          <FormInput label="Regiao desejada" {...register("desiredRegion")} />
          <FormInput label="Orcamento minimo" {...register("budgetMin")} />
          <FormInput label="Orcamento maximo" {...register("budgetMax")} />
          <FormSelect
            label="Etapa do pipeline"
            options={saleLeadStageOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            error={errors.pipelineStage?.message}
            {...register("pipelineStage")}
          />
          <FormSelect
            label="Status"
            options={leadStatusOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            error={errors.status?.message}
            {...register("status")}
          />
          <FormSelect
            label="Responsavel"
            options={responsibleOptions}
            placeholder="Selecione o responsavel"
            error={errors.responsibleUserId?.message}
            {...register("responsibleUserId")}
          />
          <FormSelect
            label="Imovel vinculado"
            options={propertyOptions}
            placeholder="Lead sem imovel definido"
            {...register("propertyId")}
          />
          <FormInput
            label="Ultimo contato"
            type="datetime-local"
            {...register("lastContactAt")}
          />
          <FormInput
            label="Proximo follow-up"
            type="datetime-local"
            {...register("nextFollowUpAt")}
          />
        </div>

        <FormTextarea label="Observacoes" {...register("notes")} />
        <FormTextarea label="Motivo de perda / arquivamento" {...register("lossReason")} />
      </form>
    </Drawer>
  );
}
