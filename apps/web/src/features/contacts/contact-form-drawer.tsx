import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactRoleOptions, personTypeOptions } from "@imobiliaria/shared";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormSwitch } from "@/components/form/form-switch";
import { FormTextarea } from "@/components/form/form-textarea";
import { Drawer } from "@/components/layout/drawer";
import { cn } from "@/lib/cn";
import type { ContactPayload } from "@/services/contacts-service";
import type { ContactListItem, ContactRole } from "@/types/domain";

const contactSchema = z.object({
  personType: z.string().min(1, "Selecione o tipo de pessoa."),
  fullName: z.string().trim().min(3, "Informe o nome completo."),
  document: z.string().trim().optional(),
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
  notes: z.string().trim().optional(),
  isActive: z.boolean(),
  roles: z.array(z.string()).min(1, "Selecione ao menos um papel."),
});

type ContactFormValues = z.infer<typeof contactSchema>;

type ContactFormDrawerProps = {
  open: boolean;
  initialData?: ContactListItem | null;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: ContactPayload) => Promise<void>;
};

function toNullable(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function buildDefaults(
  initialData?: ContactListItem | null,
): ContactFormValues {
  return {
    personType: initialData?.personType ?? "INDIVIDUAL",
    fullName: initialData?.fullName ?? "",
    document: initialData?.document ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    secondaryPhone: initialData?.secondaryPhone ?? "",
    zipCode: initialData?.zipCode ?? "",
    state: initialData?.state ?? "",
    city: initialData?.city ?? "",
    district: initialData?.district ?? "",
    street: initialData?.street ?? "",
    streetNumber: initialData?.streetNumber ?? "",
    complement: initialData?.complement ?? "",
    notes: initialData?.notes ?? "",
    isActive: initialData?.isActive ?? true,
    roles: initialData?.roles ?? ["BUYER"],
  };
}

export function ContactFormDrawer({
  open,
  initialData,
  pending,
  onClose,
  onSubmit,
}: ContactFormDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: buildDefaults(initialData),
  });

  useEffect(() => {
    reset(buildDefaults(initialData));
  }, [initialData, reset]);

  const isActive = watch("isActive");
  const selectedRoles = watch("roles");

  function toggleRole(role: ContactRole) {
    const nextRoles = selectedRoles.includes(role)
      ? selectedRoles.filter((selectedRole) => selectedRole !== role)
      : [...selectedRoles, role];

    setValue("roles", nextRoles, { shouldDirty: true, shouldValidate: true });
  }

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      personType: values.personType,
      fullName: values.fullName,
      document: toNullable(values.document),
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
      notes: toNullable(values.notes),
      isActive: values.isActive,
      roles: values.roles,
    });
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initialData ? "Editar contato" : "Novo contato"}
      description="Cadastre uma pessoa uma única vez e atribua os papéis operacionais necessários."
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="secondary-button">
            Cancelar
          </button>
          <button
            type="submit"
            form="contact-form"
            disabled={pending}
            className="primary-button disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar contato"}
          </button>
        </div>
      }
    >
      <form id="contact-form" className="space-y-6" onSubmit={submit}>
        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-ink-800">
              Papéis do contato
            </p>
            <p className="mt-1 text-xs text-ink-500">
              Um mesmo cadastro pode atuar como proprietário, locatário,
              comprador, fiador ou corretor externo.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {contactRoleOptions.map((option) => {
              const checked = selectedRoles.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleRole(option.value)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left text-sm transition duration-200",
                    checked
                      ? "border-brand-300 bg-brand-50 text-brand-800 shadow-[0_18px_34px_-28px_rgba(34,109,87,0.45)]"
                      : "border-ink-200 bg-white/84 text-ink-600 hover:border-brand-200 hover:text-ink-900",
                  )}
                >
                  <span className="font-semibold">{option.label}</span>
                </button>
              );
            })}
          </div>

          {errors.roles?.message ? (
            <p className="text-sm text-rose-600">{errors.roles.message}</p>
          ) : null}
        </section>

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
            placeholder="Somente números, se possível"
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
          <FormInput
            label="E-mail"
            error={errors.email?.message}
            {...register("email")}
          />
          <FormInput label="Telefone principal" {...register("phone")} />
          <FormInput
            label="Telefone secundário"
            {...register("secondaryPhone")}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="CEP" {...register("zipCode")} />
          <FormInput label="UF" maxLength={2} {...register("state")} />
          <FormInput label="Cidade" {...register("city")} />
          <FormInput label="Bairro" {...register("district")} />
          <div className="md:col-span-2">
            <FormInput label="Logradouro" {...register("street")} />
          </div>
          <FormInput label="Número" {...register("streetNumber")} />
          <FormInput label="Complemento" {...register("complement")} />
        </div>

        <FormTextarea
          label="Observações"
          placeholder="Registre contexto operacional, preferências ou histórico relevante."
          {...register("notes")}
        />

        <FormSwitch
          label="Cadastro ativo"
          description="Desative apenas quando este contato não puder ser usado em novos processos."
          checked={isActive}
          onChange={(checked) => setValue("isActive", checked)}
        />
      </form>
    </Drawer>
  );
}
