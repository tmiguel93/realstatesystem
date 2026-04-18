import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { scoreStatusOptions } from "@imobiliaria/shared";
import { Drawer } from "@/components/layout/drawer";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSwitch } from "@/components/form/form-switch";
import type { TenantDetail, TenantListItem } from "@/types/domain";

const tenantSchema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo."),
  document: z.string().trim().min(11, "Informe CPF."),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  secondaryPhone: z.string().trim().optional(),
  zipCode: z.string().trim().optional(),
  state: z.string().trim().optional(),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  street: z.string().trim().optional(),
  streetNumber: z.string().trim().optional(),
  complement: z.string().trim().optional(),
  scoreStatus: z.string().trim().min(1, "Selecione o status cadastral."),
  scoreValue: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  isActive: z.boolean(),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

type TenantFormDrawerProps = {
  open: boolean;
  initialData?: TenantDetail | TenantListItem | null;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: {
    fullName: string;
    document: string;
    email?: string | null;
    phone?: string | null;
    secondaryPhone?: string | null;
    zipCode?: string | null;
    state?: string | null;
    city?: string | null;
    district?: string | null;
    street?: string | null;
    streetNumber?: string | null;
    complement?: string | null;
    scoreStatus: string;
    scoreValue?: number | null;
    notes?: string | null;
    isActive: boolean;
  }) => Promise<void>;
};

function toNullable(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function toNullableNumber(value?: string) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const numberValue = Number(normalized);
  return Number.isNaN(numberValue) ? null : numberValue;
}

function buildDefaults(initialData?: TenantDetail | TenantListItem | null): TenantFormValues {
  const detailData = initialData as TenantDetail | null | undefined;

  return {
    fullName: initialData?.fullName ?? "",
    document: initialData?.document ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    secondaryPhone: detailData?.secondaryPhone ?? "",
    zipCode: detailData?.zipCode ?? "",
    state: initialData?.state ?? "",
    city: initialData?.city ?? "",
    district: detailData?.district ?? "",
    street: detailData?.street ?? "",
    streetNumber: detailData?.streetNumber ?? "",
    complement: detailData?.complement ?? "",
    scoreStatus: initialData?.scoreStatus ?? "NOT_ANALYZED",
    scoreValue: initialData?.scoreValue !== null ? String(initialData?.scoreValue ?? "") : "",
    notes: detailData?.notes ?? "",
    isActive: initialData?.isActive ?? true,
  };
}

export function TenantFormDrawer({
  open,
  initialData,
  pending,
  onClose,
  onSubmit,
}: TenantFormDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: buildDefaults(initialData),
  });

  useEffect(() => {
    reset(buildDefaults(initialData));
  }, [initialData, reset]);

  const isActive = watch("isActive");

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      fullName: values.fullName,
      document: values.document,
      email: toNullable(values.email),
      phone: toNullable(values.phone),
      secondaryPhone: toNullable(values.secondaryPhone),
      zipCode: toNullable(values.zipCode),
      state: toNullable(values.state),
      city: toNullable(values.city),
      district: toNullable(values.district),
      street: toNullable(values.street),
      streetNumber: toNullable(values.streetNumber),
      complement: toNullable(values.complement),
      scoreStatus: values.scoreStatus,
      scoreValue: toNullableNumber(values.scoreValue),
      notes: toNullable(values.notes),
      isActive: values.isActive,
    });
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initialData ? "Editar locatario" : "Novo locatario"}
      description="Cadastro com score, contato e historico de relacionamento locatario."
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
            form="tenant-form"
            disabled={pending}
            className="rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar locatario"}
          </button>
        </div>
      }
    >
      <form id="tenant-form" className="space-y-6" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormInput
              label="Nome completo"
              error={errors.fullName?.message}
              {...register("fullName")}
            />
          </div>
          <FormInput
            label="CPF"
            error={errors.document?.message}
            {...register("document")}
          />
          <FormSelect
            label="Status cadastral"
            options={scoreStatusOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            error={errors.scoreStatus?.message}
            {...register("scoreStatus")}
          />
          <FormInput label="Email" {...register("email")} />
          <FormInput label="Telefone" {...register("phone")} />
          <FormInput label="Telefone secundario" {...register("secondaryPhone")} />
          <FormInput label="Score numerico" {...register("scoreValue")} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="CEP" {...register("zipCode")} />
          <FormInput label="UF" maxLength={2} {...register("state")} />
          <FormInput label="Cidade" {...register("city")} />
          <FormInput label="Bairro" {...register("district")} />
          <div className="md:col-span-2">
            <FormInput label="Logradouro" {...register("street")} />
          </div>
          <FormInput label="Numero" {...register("streetNumber")} />
          <FormInput label="Complemento" {...register("complement")} />
        </div>

        <FormTextarea label="Observacoes" {...register("notes")} />

        <FormSwitch
          label="Cadastro ativo"
          description="Use a inativacao para preservar o historico sem permitir novos vinculos."
          checked={isActive}
          onChange={(checked) => setValue("isActive", checked)}
        />
      </form>
    </Drawer>
  );
}
