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
  receivedBy: z.string().trim().min(2, "Informe quem recebeu."),
  keyCondition: z.string().trim().min(1, "Selecione o estado da chave."),
  notes: z.string().trim().optional(),
});

type CheckinValues = z.infer<typeof checkinSchema>;

const keyConditionOptions = [
  { value: "Normal", label: "Normal" },
  { value: "Com observação", label: "Com observação" },
  { value: "Problema identificado", label: "Problema identificado" },
];

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
    formState: { errors },
  } = useForm<CheckinValues>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      returnedAt: toDateTimeLocalValue(new Date()),
      receivedBy: "",
      keyCondition: "Normal",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        returnedAt: toDateTimeLocalValue(new Date()),
        receivedBy: "",
        keyCondition: "Normal",
        notes: "",
      });
    }
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    const notes = [
      `Recebido por: ${values.receivedBy}`,
      `Estado da chave: ${values.keyCondition}`,
      toNullable(values.notes),
    ].filter(Boolean).join("\n");

    await onSubmit({
      returnedAt: toIsoOrNull(values.returnedAt),
      notes: notes || null,
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
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Data da devolução" type="datetime-local" {...register("returnedAt")} />
          <FormInput
            label="Quem recebeu"
            error={errors.receivedBy?.message}
            {...register("receivedBy")}
          />
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink-700">
              Estado da chave
            </span>
            <select className="field-control" {...register("keyCondition")}>
              {keyConditionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.keyCondition?.message ? (
              <p className="text-sm text-rose-600">
                {errors.keyCondition.message}
              </p>
            ) : null}
          </label>
        </div>
        <FormTextarea label="Observações" {...register("notes")} />
      </form>
    </Drawer>
  );
}
