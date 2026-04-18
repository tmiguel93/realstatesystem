import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { maintenanceTicketStatusOptions } from "@imobiliaria/shared";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";
import { SectionCard } from "@/components/feedback/section-card";

const maintenanceStatusPanelSchema = z
  .object({
    status: z.string().trim().min(1, "Selecione um status."),
    assignedToUserId: z.string().optional(),
    resolutionSummary: z.string().trim().optional(),
    cancelReason: z.string().trim().optional(),
    internalNotes: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (value.status === "FINISHED" && !value.resolutionSummary?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["resolutionSummary"],
        message: "Finalizacao exige resumo da resolucao.",
      });
    }

    if (value.status === "CANCELLED" && !value.cancelReason?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cancelReason"],
        message: "Cancelamento exige motivo.",
      });
    }
  });

type MaintenanceStatusPanelValues = z.infer<
  typeof maintenanceStatusPanelSchema
>;

type MaintenanceStatusPanelProps = {
  currentStatus: string;
  currentAssignedToUserId?: string | null;
  responsibleOptions: Array<{ value: string; label: string }>;
  pending?: boolean;
  onSubmit: (payload: {
    status: string;
    assignedToUserId?: string | null;
    resolutionSummary?: string | null;
    cancelReason?: string | null;
    internalNotes?: string | null;
  }) => Promise<void>;
};

export function MaintenanceStatusPanel({
  currentStatus,
  currentAssignedToUserId,
  responsibleOptions,
  pending,
  onSubmit,
}: MaintenanceStatusPanelProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<MaintenanceStatusPanelValues>({
    resolver: zodResolver(maintenanceStatusPanelSchema),
    defaultValues: {
      status: currentStatus,
      assignedToUserId: currentAssignedToUserId ?? "",
      resolutionSummary: "",
      cancelReason: "",
      internalNotes: "",
    },
  });

  useEffect(() => {
    reset({
      status: currentStatus,
      assignedToUserId: currentAssignedToUserId ?? "",
      resolutionSummary: "",
      cancelReason: "",
      internalNotes: "",
    });
  }, [currentAssignedToUserId, currentStatus, reset]);

  const selectedStatus = watch("status");

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      status: values.status,
      assignedToUserId: values.assignedToUserId || null,
      resolutionSummary: values.resolutionSummary?.trim()
        ? values.resolutionSummary
        : null,
      cancelReason: values.cancelReason?.trim() ? values.cancelReason : null,
      internalNotes: values.internalNotes?.trim() ? values.internalNotes : null,
    });
  });

  return (
    <SectionCard
      title="Movimentar chamado"
      description="Atualize status, responsavel e contexto operacional. Finalizacao exige resolucao e cancelamento exige motivo."
    >
      <form className="space-y-4" onSubmit={submit}>
        <FormSelect
          label="Novo status"
          options={maintenanceTicketStatusOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          error={errors.status?.message}
          {...register("status")}
        />

        <FormSelect
          label="Responsavel"
          options={responsibleOptions}
          {...register("assignedToUserId")}
        />

        {(selectedStatus === "RESOLVED" || selectedStatus === "FINISHED") && (
          <FormTextarea
            label="Resumo da resolucao"
            placeholder="Descreva a solucao aplicada, prestador, data e impacto resolvido."
            error={errors.resolutionSummary?.message}
            {...register("resolutionSummary")}
          />
        )}

        {selectedStatus === "CANCELLED" && (
          <FormTextarea
            label="Motivo do cancelamento"
            placeholder="Explique por que o chamado foi cancelado."
            error={errors.cancelReason?.message}
            {...register("cancelReason")}
          />
        )}

        <FormTextarea
          label="Observacao interna da movimentacao"
          placeholder="Registre um contexto curto da decisao, do prestador ou do proximo passo."
          error={errors.internalNotes?.message}
          {...register("internalNotes")}
        />

        <button
          type="submit"
          disabled={pending}
          className="primary-button w-full disabled:opacity-60"
        >
          {pending ? "Salvando atualizacao..." : "Salvar movimentacao"}
        </button>
      </form>
    </SectionCard>
  );
}
