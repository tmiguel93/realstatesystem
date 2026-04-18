import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { keyStatusOptions } from "@imobiliaria/shared";
import { Drawer } from "@/components/layout/drawer";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";
import type { PropertyKeyListItem } from "@/types/domain";

const keyStatusSchema = z.object({
  status: z.string().trim().min(1, "Selecione o novo status."),
  notes: z.string().trim().optional(),
  overrideReason: z.string().trim().optional(),
});

type KeyStatusValues = z.infer<typeof keyStatusSchema>;

type KeyStatusDrawerProps = {
  open: boolean;
  keyItem?: PropertyKeyListItem | null;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: {
    status: string;
    notes?: string | null;
    overrideReason?: string | null;
  }) => Promise<void>;
};

function toNullable(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function KeyStatusDrawer({
  open,
  keyItem,
  pending,
  onClose,
  onSubmit,
}: KeyStatusDrawerProps) {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<KeyStatusValues>({
    resolver: zodResolver(keyStatusSchema),
    defaultValues: {
      status: keyItem?.currentStatus ?? "AVAILABLE",
      notes: "",
      overrideReason: "",
    },
  });

  useEffect(() => {
    reset({
      status: keyItem?.currentStatus ?? "AVAILABLE",
      notes: "",
      overrideReason: "",
    });
  }, [keyItem, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      status: values.status,
      notes: toNullable(values.notes),
      overrideReason: toNullable(values.overrideReason),
    });
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Alterar status ${keyItem?.identifier ?? ""}`}
      description="Use esta acao para manutencao, bloqueio, perda ou reativacao da chave."
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
            form="key-status-form"
            disabled={pending}
            className="rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar status"}
          </button>
        </div>
      }
    >
      <form id="key-status-form" className="space-y-6" onSubmit={submit}>
        <FormSelect
          label="Novo status"
          options={keyStatusOptions
            .filter((option) => option.value !== "CHECKED_OUT")
            .map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          error={errors.status?.message}
          {...register("status")}
        />
        <FormTextarea label="Observacoes" {...register("notes")} />
        <FormTextarea label="Justificativa de override" {...register("overrideReason")} />
      </form>
    </Drawer>
  );
}
