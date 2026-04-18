import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Drawer } from "@/components/layout/drawer";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { toDateTimeLocalValue } from "@/lib/format";
import type { PropertyKeyListItem } from "@/types/domain";

const checkinSchema = z.object({
  returnedAt: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

type CheckinValues = z.infer<typeof checkinSchema>;

type KeyCheckinDrawerProps = {
  open: boolean;
  keyItem?: PropertyKeyListItem | null;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: {
    returnedAt?: string | null;
    notes?: string | null;
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

export function KeyCheckinDrawer({
  open,
  keyItem,
  pending,
  onClose,
  onSubmit,
}: KeyCheckinDrawerProps) {
  const {
    register,
    reset,
    handleSubmit,
  } = useForm<CheckinValues>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      returnedAt: toDateTimeLocalValue(new Date()),
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        returnedAt: toDateTimeLocalValue(new Date()),
        notes: "",
      });
    }
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      returnedAt: toIsoOrNull(values.returnedAt),
      notes: toNullable(values.notes),
    });
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Devolver chave ${keyItem?.identifier ?? ""}`}
      description="Registre a devolucao para liberar a chave novamente na base."
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
            form="key-checkin-form"
            disabled={pending}
            className="primary-button disabled:opacity-60"
          >
            {pending ? "Registrando..." : "Registrar devolucao"}
          </button>
        </div>
      }
    >
      <form id="key-checkin-form" className="space-y-6" onSubmit={submit}>
        <FormInput label="Data da devolucao" type="datetime-local" {...register("returnedAt")} />
        <FormTextarea label="Observacoes" {...register("notes")} />
      </form>
    </Drawer>
  );
}
