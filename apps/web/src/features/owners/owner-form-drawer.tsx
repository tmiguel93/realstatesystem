import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { personTypeOptions } from "@imobiliaria/shared";
import { Drawer } from "@/components/layout/drawer";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSwitch } from "@/components/form/form-switch";
import type { OwnerDetail, OwnerListItem } from "@/types/domain";

const ownerSchema = z.object({
  personType: z.string().min(1, "Selecione o tipo de pessoa."),
  fullName: z.string().trim().min(3, "Informe o nome completo."),
  document: z.string().trim().min(11, "Informe CPF ou CNPJ."),
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
  bankName: z.string().trim().optional(),
  bankBranch: z.string().trim().optional(),
  bankAccount: z.string().trim().optional(),
  pixKey: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  isActive: z.boolean(),
});

type OwnerFormValues = z.infer<typeof ownerSchema>;

type OwnerFormDrawerProps = {
  open: boolean;
  initialData?: OwnerDetail | OwnerListItem | null;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: {
    personType: string;
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
    bankName?: string | null;
    bankBranch?: string | null;
    bankAccount?: string | null;
    pixKey?: string | null;
    notes?: string | null;
    isActive: boolean;
  }) => Promise<void>;
};

function toNullable(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function buildDefaults(initialData?: OwnerDetail | OwnerListItem | null): OwnerFormValues {
  const detailData = initialData as OwnerDetail | null | undefined;

  return {
    personType: initialData?.personType ?? "INDIVIDUAL",
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
    bankName: detailData?.bankName ?? "",
    bankBranch: detailData?.bankBranch ?? "",
    bankAccount: detailData?.bankAccount ?? "",
    pixKey: detailData?.pixKey ?? "",
    notes: detailData?.notes ?? "",
    isActive: initialData?.isActive ?? true,
  };
}

export function OwnerFormDrawer({
  open,
  initialData,
  pending,
  onClose,
  onSubmit,
}: OwnerFormDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: buildDefaults(initialData),
  });

  useEffect(() => {
    reset(buildDefaults(initialData));
  }, [initialData, reset]);

  const isActive = watch("isActive");

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      personType: values.personType,
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
      bankName: toNullable(values.bankName),
      bankBranch: toNullable(values.bankBranch),
      bankAccount: toNullable(values.bankAccount),
      pixKey: toNullable(values.pixKey),
      notes: toNullable(values.notes),
      isActive: values.isActive,
    });
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initialData ? "Editar proprietario" : "Novo proprietario"}
      description="Cadastro completo com dados pessoais, contato, endereco e dados bancarios."
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="secondary-button"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="owner-form"
            disabled={pending}
            className="primary-button disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar proprietario"}
          </button>
        </div>
      }
    >
      <form id="owner-form" className="space-y-6" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect
            label="Tipo de pessoa"
            options={personTypeOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            error={errors.personType?.message}
            {...register("personType")}
          />
          <FormInput
            label="CPF / CNPJ"
            error={errors.document?.message}
            {...register("document")}
          />
          <div className="md:col-span-2">
            <FormInput
              label="Nome completo"
              error={errors.fullName?.message}
              {...register("fullName")}
            />
          </div>
          <FormInput label="Email" error={errors.email?.message} {...register("email")} />
          <FormInput label="Telefone" {...register("phone")} />
          <FormInput label="Telefone secundario" {...register("secondaryPhone")} />
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

        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Banco" {...register("bankName")} />
          <FormInput label="Agencia" {...register("bankBranch")} />
          <FormInput label="Conta" {...register("bankAccount")} />
          <FormInput label="Chave Pix" {...register("pixKey")} />
        </div>

        <FormTextarea label="Observacoes" {...register("notes")} />

        <FormSwitch
          label="Cadastro ativo"
          description="Desative quando o proprietario nao puder mais ser usado em novos processos."
          checked={isActive}
          onChange={(checked) => setValue("isActive", checked)}
        />
      </form>
    </Drawer>
  );
}
