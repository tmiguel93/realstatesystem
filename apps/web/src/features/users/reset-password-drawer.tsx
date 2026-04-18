import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Drawer } from "@/components/layout/drawer";
import { FormInput } from "@/components/form/form-input";
import { FormSwitch } from "@/components/form/form-switch";

const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "A senha deve ter no minimo 8 caracteres.")
    .regex(/[A-Z]/, "Inclua uma letra maiuscula.")
    .regex(/[a-z]/, "Inclua uma letra minuscula.")
    .regex(/[0-9]/, "Inclua um numero."),
  mustChangePassword: z.boolean(),
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

type ResetPasswordDrawerProps = {
  open: boolean;
  pending?: boolean;
  userName?: string;
  onClose: () => void;
  onSubmit: (values: {
    newPassword: string;
    mustChangePassword: boolean;
  }) => Promise<void>;
};

export function ResetPasswordDrawer({
  open,
  pending,
  userName,
  onClose,
  onSubmit,
}: ResetPasswordDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      mustChangePassword: true,
    },
  });

  useEffect(() => {
    reset({
      newPassword: "",
      mustChangePassword: true,
    });
  }, [open, reset]);

  const mustChangePassword = watch("mustChangePassword");

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Redefinir senha"
      description={`Nova senha de acesso para ${userName ?? "usuario selecionado"}.`}
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
            form="reset-password-form"
            disabled={pending}
            className="rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Redefinir senha"}
          </button>
        </div>
      }
    >
      <form id="reset-password-form" className="space-y-6" onSubmit={submit}>
        <FormInput
          label="Nova senha"
          type="password"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />

        <FormSwitch
          label="Exigir troca no proximo acesso"
          checked={mustChangePassword}
          onChange={(checked) => setValue("mustChangePassword", checked)}
        />
      </form>
    </Drawer>
  );
}
