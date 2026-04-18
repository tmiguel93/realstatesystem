import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appRoutes, permissionCodes } from "@imobiliaria/shared";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { useAuth } from "@/features/auth/auth-context";
import { MaintenanceModuleNav } from "@/features/maintenance/maintenance-module-nav";
import { MaintenanceTicketForm } from "@/features/maintenance/maintenance-ticket-form";
import { buildDetailPath } from "@/lib/format";
import { maintenanceService } from "@/services/maintenance-service";

export function MaintenanceTicketNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken, hasPermission } = useAuth();

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof maintenanceService.create>[1]) =>
      maintenanceService.create(accessToken!, payload),
    onSuccess: async (ticket) => {
      toast.success(`Chamado ${ticket.ticketId} aberto com sucesso.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["maintenance-tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenance-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenance-kanban"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
      navigate(buildDetailPath(appRoutes.maintenanceTicketDetail, ticket.id));
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operacao tecnica"
        title="Abrir chamado de manutencao"
        description="Registre o ticket com vinculo ao imovel, locatario atual, urgencia automatica, responsavel e trilha inicial de anexos."
      />

      <MaintenanceModuleNav />

      <SectionCard
        title="Formulario de abertura"
        description={
          hasPermission(permissionCodes.MAINTENANCE_OVERRIDE)
            ? "Voce possui acesso a override de urgencia e ajuste manual de locatario com auditoria."
            : "A urgencia segue a regra automatica do tipo de chamado e o locatario ativo e vinculado quando existir."
        }
      >
        {accessToken ? (
          <MaintenanceTicketForm
            accessToken={accessToken}
            pending={createMutation.isPending}
            onSubmit={async (payload) => {
              await createMutation.mutateAsync(payload);
            }}
          />
        ) : null}
      </SectionCard>
    </div>
  );
}
