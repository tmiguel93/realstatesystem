import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Drawer } from "@/components/layout/drawer";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormSwitch } from "@/components/form/form-switch";

const keySchema = z.object({
  propertyId: z.string().trim().min(1, "Selecione o imovel."),
  identifier: z.string().trim().min(1, "Informe o identificador."),
  description: z.string().trim().optional(),
  isCopy: z.boolean(),
});

type KeyFormValues = z.infer<typeof keySchema>;

type KeyFormDrawerProps = {
  open: boolean;
  propertyOptions: Array<{ value: string; label: string }>;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: {
    propertyId: string;
    identifier: string;
    description?: string | null;
    isCopy: boolean;
  }) => Promise<void>;
};

function toNullable(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function KeyFormDrawer({
  open,
  propertyOptions,
  pending,
  onClose,
  onSubmit,
}: KeyFormDrawerProps) {
  const {
    register,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<KeyFormValues>({
    resolver: zodResolver(keySchema),
    defaultValues: {
      propertyId: "",
      identifier: "",
      description: "",
      isCopy: false,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        propertyId: "",
        identifier: "",
        description: "",
        isCopy: false,
      });
    }
  }, [open, reset]);

  const isCopy = watch("isCopy");

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      propertyId: values.propertyId,
      identifier: values.identifier,
      description: toNullable(values.description),
      isCopy: values.isCopy,
    });
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Nova chave"
      description="Cadastre uma chave por imovel para controlar posse, copia e manutencao."
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
            form="key-form"
            disabled={pending}
            className="primary-button disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar chave"}
          </button>
        </div>
      }
    >
      <form id="key-form" className="space-y-6" onSubmit={submit}>
        <div className="grid gap-4">
          <FormSelect
            label="Imovel"
            options={propertyOptions}
            placeholder="Selecione o imovel"
            error={errors.propertyId?.message}
            {...register("propertyId")}
          />
          <FormInput
            label="Identificador"
            error={errors.identifier?.message}
            {...register("identifier")}
          />
          <FormInput label="Descricao" {...register("description")} />
        </div>

        <FormSwitch
          label="Trata-se de uma copia"
          description="Chaves de copia retornam ao status de copia quando voltam para a base."
          checked={isCopy}
          onChange={(checked) => setValue("isCopy", checked)}
        />
      </form>
    </Drawer>
  );
}
