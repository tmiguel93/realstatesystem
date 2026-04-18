import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleLabels, userStatusOptions } from "@imobiliaria/shared";
import { Drawer } from "@/components/layout/drawer";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormSwitch } from "@/components/form/form-switch";
import type { RoleItem, UserDetail, UserListItem } from "@/types/domain";

const userSchema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo."),
  email: z.string().trim().email("Informe um email valido."),
  phone: z.string().trim().optional(),
  status: z.string().trim().min(1, "Selecione o status."),
  mustChangePassword: z.boolean(),
  password: z.string().trim().optional(),
  roleCodes: z.array(z.string()).min(1, "Selecione ao menos um perfil."),
});

type UserFormValues = z.infer<typeof userSchema>;

type UserFormDrawerProps = {
  open: boolean;
  roles: RoleItem[];
  initialData?: UserDetail | UserListItem | null;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: {
    fullName: string;
    email: string;
    phone?: string | null;
    status: string;
    mustChangePassword: boolean;
    roleCodes: string[];
    password?: string;
  }) => Promise<void>;
};

function buildDefaults(initialData?: UserDetail | UserListItem | null): UserFormValues {
  return {
    fullName: initialData?.fullName ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    status: initialData?.status ?? "ACTIVE",
    mustChangePassword: initialData?.mustChangePassword ?? true,
    password: "",
    roleCodes: initialData?.roleCodes ?? [],
  };
}

function toNullable(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function UserFormDrawer({
  open,
  roles,
  initialData,
  pending,
  onClose,
  onSubmit,
}: UserFormDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: buildDefaults(initialData),
  });

  useEffect(() => {
    reset(buildDefaults(initialData));
  }, [initialData, reset]);

  const roleCodes = watch("roleCodes");
  const mustChangePassword = watch("mustChangePassword");

  const submit = handleSubmit(async (values) => {
    if (!initialData) {
      const normalizedPassword = values.password?.trim() ?? "";

      if (!normalizedPassword) {
        setError("password", {
          message: "Informe a senha inicial.",
        });
        return;
      }

      if (normalizedPassword.length < 8) {
        setError("password", {
          message: "A senha inicial deve ter no minimo 8 caracteres.",
        });
        return;
      }
    }

    await onSubmit({
      fullName: values.fullName,
      email: values.email,
      phone: toNullable(values.phone),
      status: values.status,
      mustChangePassword: values.mustChangePassword,
      roleCodes: values.roleCodes,
      password: initialData ? undefined : values.password,
    });
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initialData ? "Editar usuario" : "Novo usuario"}
      description="Controle perfis, status operacional e politica de troca de senha."
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
            form="user-form"
            disabled={pending}
            className="primary-button disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar usuario"}
          </button>
        </div>
      }
    >
      <form id="user-form" className="space-y-6" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormInput
              label="Nome completo"
              error={errors.fullName?.message}
              {...register("fullName")}
            />
          </div>
          <FormInput
            label="Email"
            error={errors.email?.message}
            {...register("email")}
          />
          <FormInput label="Telefone" {...register("phone")} />
          <FormSelect
            label="Status"
            options={userStatusOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            error={errors.status?.message}
            {...register("status")}
          />
          {!initialData ? (
            <FormInput
              label="Senha inicial"
              type="password"
              error={errors.password?.message}
              {...register("password")}
            />
          ) : null}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-ink-700">Perfis de acesso</p>
            {errors.roleCodes?.message ? (
              <p className="mt-1 text-sm text-rose-600">
                {errors.roleCodes.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-3">
            {roles.map((role) => {
              const checked = roleCodes.includes(role.code);

              return (
                <button
                  key={role.code}
                  type="button"
                  onClick={() =>
                    setValue(
                      "roleCodes",
                      checked
                        ? roleCodes.filter((code) => code !== role.code)
                        : [...roleCodes, role.code],
                      { shouldValidate: true },
                    )
                  }
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    checked
                      ? "border-brand-200 bg-brand-50"
                      : "border-ink-200 bg-white"
                  }`}
                >
                  <p className="text-sm font-semibold text-ink-900">
                    {roleLabels[role.code as keyof typeof roleLabels] ?? role.name}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    {role.permissionCodes.length} permissoes herdadas
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <FormSwitch
          label="Exigir troca de senha no proximo acesso"
          checked={mustChangePassword}
          onChange={(checked) => setValue("mustChangePassword", checked)}
        />
      </form>
    </Drawer>
  );
}
