import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { holderTypeOptions } from "@imobiliaria/shared";
import { Drawer } from "@/components/layout/drawer";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";
import { toDateTimeLocalValue } from "@/lib/format";
import type { PropertyKeyListItem } from "@/types/domain";

const checkoutSchema = z.object({
  holderType: z.string().trim().min(1, "Selecione quem retirou."),
  holderName: z.string().trim().min(3, "Informe quem retirou."),
  holderDocument: z.string().trim().optional(),
  checkoutAt: z.string().trim().optional(),
  expectedReturnAt: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  overrideReason: z.string().trim().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

type KeyCheckoutDrawerProps = {
  open: boolean;
  keyItem?: PropertyKeyListItem | null;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: {
    holderType: string;
    holderName: string;
    holderDocument?: string | null;
    checkoutAt?: string | null;
    expectedReturnAt?: string | null;
    notes?: string | null;
    overrideReason?: string | null;
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

export function KeyCheckoutDrawer({
  open,
  keyItem,
  pending,
  onClose,
  onSubmit,
}: KeyCheckoutDrawerProps) {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      holderType: "CLIENT",
      holderName: "",
      holderDocument: "",
      checkoutAt: toDateTimeLocalValue(new Date()),
      expectedReturnAt: "",
      notes: "",
      overrideReason: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        holderType: "CLIENT",
        holderName: "",
        holderDocument: "",
        checkoutAt: toDateTimeLocalValue(new Date()),
        expectedReturnAt: "",
        notes: "",
        overrideReason: "",
      });
    }
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      holderType: values.holderType,
      holderName: values.holderName,
      holderDocument: toNullable(values.holderDocument),
      checkoutAt: toIsoOrNull(values.checkoutAt),
      expectedReturnAt: toIsoOrNull(values.expectedReturnAt),
      notes: toNullable(values.notes),
      overrideReason: toNullable(values.overrideReason),
    });
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Retirar chave ${keyItem?.identifier ?? ""}`}
      description="Registre quem retirou, quando retirou e quando a chave deve retornar."
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
            form="key-checkout-form"
            disabled={pending}
            className="rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "Registrando..." : "Registrar retirada"}
          </button>
        </div>
      }
    >
      <form id="key-checkout-form" className="space-y-6" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect
            label="Quem retirou"
            options={holderTypeOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            error={errors.holderType?.message}
            {...register("holderType")}
          />
          <FormInput
            label="Nome do portador"
            error={errors.holderName?.message}
            {...register("holderName")}
          />
          <FormInput label="Documento" {...register("holderDocument")} />
          <FormInput label="Data da retirada" type="datetime-local" {...register("checkoutAt")} />
          <FormInput
            label="Devolucao esperada"
            type="datetime-local"
            {...register("expectedReturnAt")}
          />
        </div>

        <FormTextarea label="Observacoes" {...register("notes")} />
        <FormTextarea label="Justificativa de override" {...register("overrideReason")} />
      </form>
    </Drawer>
  );
}
