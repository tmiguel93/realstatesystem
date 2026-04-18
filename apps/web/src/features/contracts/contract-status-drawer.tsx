import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Drawer } from "@/components/layout/drawer";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";

const statusSchema = z.object({
  status: z.string().trim().min(1, "Selecione o novo status."),
  terminationReason: z.string().trim().optional(),
});

type StatusFormValues = z.infer<typeof statusSchema>;

type ContractStatusDrawerProps = {
  open: boolean;
  currentStatus: string;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    status: "ACTIVE" | "TERMINATED" | "CANCELLED" | "EXPIRED" | "RENEWED";
    terminationReason?: string | null;
  }) => Promise<void>;
};

function toNullable(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function ContractStatusDrawer({
  open,
  currentStatus,
  pending,
  onClose,
  onSubmit,
}: ContractStatusDrawerProps) {
  const statusOptions = useMemo(() => {
    if (currentStatus === "PENDING_SIGNATURE") {
      return [
        { value: "ACTIVE", label: "Ativar contrato" },
        { value: "CANCELLED", label: "Cancelar contrato" },
        { value: "TERMINATED", label: "Encerrar contrato" },
      ];
    }

    if (currentStatus === "ACTIVE") {
      return [
        { value: "TERMINATED", label: "Encerrar contrato" },
        { value: "EXPIRED", label: "Marcar como expirado" },
        { value: "RENEWED", label: "Marcar como renovado" },
      ];
    }

    return [{ value: "CANCELLED", label: "Cancelar contrato" }];
  }, [currentStatus]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      status: statusOptions[0]?.value ?? "CANCELLED",
      terminationReason: "",
    },
  });

  useEffect(() => {
    reset({
      status: statusOptions[0]?.value ?? "CANCELLED",
      terminationReason: "",
    });
  }, [reset, statusOptions]);

  const selectedStatus = watch("status");

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      status: values.status as
        | "ACTIVE"
        | "TERMINATED"
        | "CANCELLED"
        | "EXPIRED"
        | "RENEWED",
      terminationReason:
        selectedStatus === "ACTIVE" ? null : toNullable(values.terminationReason),
    });
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Atualizar status do contrato"
      description="Controle assinatura, ativacao, encerramento e eventos de vigencia sem perder o historico."
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
            form="contract-status-form"
            disabled={pending}
            className="primary-button disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar status"}
          </button>
        </div>
      }
    >
      <form id="contract-status-form" className="space-y-6" onSubmit={submit}>
        <FormSelect
          label="Novo status"
          options={statusOptions}
          error={errors.status?.message}
          {...register("status")}
        />
        {selectedStatus !== "ACTIVE" ? (
          <FormTextarea
            label="Motivo / observacao"
            error={errors.terminationReason?.message}
            {...register("terminationReason")}
          />
        ) : null}
      </form>
    </Drawer>
  );
}
