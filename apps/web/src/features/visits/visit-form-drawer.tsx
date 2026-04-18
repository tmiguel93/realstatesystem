import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { visitOutcomeOptions, visitStatusOptions } from "@imobiliaria/shared";
import { Drawer } from "@/components/layout/drawer";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";
import { toDateTimeLocalValue } from "@/lib/format";
import type { VisitDetail, VisitListItem } from "@/types/domain";

const visitSchema = z.object({
  propertyId: z.string().trim().min(1, "Selecione o imovel."),
  leadType: z.enum(["SALE", "RENT"]),
  saleLeadId: z.string().trim().optional(),
  rentLeadId: z.string().trim().optional(),
  brokerUserId: z.string().trim().min(1, "Selecione o corretor."),
  scheduledAt: z.string().trim().min(1, "Informe data e hora."),
  status: z.string().trim().min(1, "Selecione o status."),
  completedAt: z.string().trim().optional(),
  outcome: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  resultSummary: z.string().trim().optional(),
});

type VisitFormValues = z.infer<typeof visitSchema>;

type VisitFormDrawerProps = {
  open: boolean;
  propertyOptions: Array<{ value: string; label: string }>;
  brokerOptions: Array<{ value: string; label: string }>;
  saleLeadOptions: Array<{ value: string; label: string }>;
  rentLeadOptions: Array<{ value: string; label: string }>;
  initialData?: VisitDetail | VisitListItem | null;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: {
    propertyId: string;
    saleLeadId?: string | null;
    rentLeadId?: string | null;
    brokerUserId: string;
    scheduledAt: string;
    status: string;
    completedAt?: string | null;
    outcome?: string | null;
    notes?: string | null;
    resultSummary?: string | null;
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

function buildDefaults(initialData?: VisitDetail | VisitListItem | null): VisitFormValues {
  const detailData = initialData as VisitDetail | null | undefined;

  return {
    propertyId: initialData?.property.id ?? "",
    leadType: initialData?.lead?.type ?? "SALE",
    saleLeadId: initialData?.lead?.type === "SALE" ? initialData.lead.id : "",
    rentLeadId: initialData?.lead?.type === "RENT" ? initialData.lead.id : "",
    brokerUserId: initialData?.broker.id ?? "",
    scheduledAt: toDateTimeLocalValue(initialData?.scheduledAt),
    status: initialData?.status ?? "SCHEDULED",
    completedAt: toDateTimeLocalValue(initialData?.completedAt),
    outcome: initialData?.outcome ?? "",
    notes: detailData?.notes ?? "",
    resultSummary: detailData?.resultSummary ?? "",
  };
}

export function VisitFormDrawer({
  open,
  propertyOptions,
  brokerOptions,
  saleLeadOptions,
  rentLeadOptions,
  initialData,
  pending,
  onClose,
  onSubmit,
}: VisitFormDrawerProps) {
  const {
    register,
    watch,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: buildDefaults(initialData),
  });

  useEffect(() => {
    reset(buildDefaults(initialData));
  }, [initialData, reset]);

  const leadType = watch("leadType");

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      propertyId: values.propertyId,
      saleLeadId: leadType === "SALE" ? toNullable(values.saleLeadId) : null,
      rentLeadId: leadType === "RENT" ? toNullable(values.rentLeadId) : null,
      brokerUserId: values.brokerUserId,
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      status: values.status,
      completedAt: toIsoOrNull(values.completedAt),
      outcome: toNullable(values.outcome),
      notes: toNullable(values.notes),
      resultSummary: toNullable(values.resultSummary),
    });
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initialData ? "Editar visita" : "Nova visita"}
      description="Toda visita precisa estar vinculada a um imovel e a um lead ativo do pipeline."
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
            form="visit-form"
            disabled={pending}
            className="rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar visita"}
          </button>
        </div>
      }
    >
      <form id="visit-form" className="space-y-6" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect
            label="Imovel"
            options={propertyOptions}
            placeholder="Selecione o imovel"
            error={errors.propertyId?.message}
            {...register("propertyId")}
          />
          <FormSelect
            label="Tipo de lead"
            options={[
              { value: "SALE", label: "Venda" },
              { value: "RENT", label: "Locacao" },
            ]}
            {...register("leadType")}
          />
          {leadType === "SALE" ? (
            <FormSelect
              label="Lead de venda"
              options={saleLeadOptions}
              placeholder="Selecione o lead"
              {...register("saleLeadId")}
            />
          ) : (
            <FormSelect
              label="Lead de locacao"
              options={rentLeadOptions}
              placeholder="Selecione o lead"
              {...register("rentLeadId")}
            />
          )}
          <FormSelect
            label="Corretor responsavel"
            options={brokerOptions}
            placeholder="Selecione o corretor"
            error={errors.brokerUserId?.message}
            {...register("brokerUserId")}
          />
          <FormInput
            label="Data e hora"
            type="datetime-local"
            error={errors.scheduledAt?.message}
            {...register("scheduledAt")}
          />
          <FormSelect
            label="Status"
            options={visitStatusOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            error={errors.status?.message}
            {...register("status")}
          />
          <FormInput label="Conclusao em" type="datetime-local" {...register("completedAt")} />
          <FormSelect
            label="Resultado"
            options={visitOutcomeOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            placeholder="Sem resultado definido"
            {...register("outcome")}
          />
        </div>

        <FormTextarea label="Observacoes" {...register("notes")} />
        <FormTextarea label="Resumo do resultado" {...register("resultSummary")} />
      </form>
    </Drawer>
  );
}
