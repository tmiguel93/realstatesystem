import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  leadSourceOptions,
  leadStatusOptions,
  saleLeadStageOptions,
} from "@imobiliaria/shared";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useAuth } from "@/features/auth/auth-context";
import { SaleLeadFormDrawer } from "@/features/sales/sale-lead-form-drawer";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getOptionLabel } from "@/lib/options";
import { resolveStatusTone } from "@/lib/status";
import { propertiesService } from "@/services/properties-service";
import { salesService } from "@/services/sales-service";
import { usersService } from "@/services/users-service";

export function SaleLeadDetailPage() {
  const { leadId = "" } = useParams();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const leadQuery = useQuery({
    queryKey: ["sale-lead-detail", leadId],
    queryFn: () => salesService.getById(accessToken!, leadId),
    enabled: Boolean(accessToken && leadId),
  });

  const usersQuery = useQuery({
    queryKey: ["assignable-users"],
    queryFn: () => usersService.listAssignable(accessToken!),
    enabled: Boolean(accessToken),
  });

  const propertiesQuery = useQuery({
    queryKey: ["properties-select"],
    queryFn: () =>
      propertiesService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(accessToken),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof salesService.update>[2]) =>
      salesService.update(accessToken!, leadId, payload),
    onSuccess: async () => {
      toast.success("Lead de venda atualizado.");
      setDrawerOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["sale-lead-detail", leadId] });
      await queryClient.invalidateQueries({ queryKey: ["sale-leads-board"] });
    },
  });

  const lead = leadQuery.data;

  if (!lead) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detalhe do lead"
        title={`${lead.code} - ${lead.customerName}`}
        description={`${getOptionLabel(saleLeadStageOptions, lead.pipelineStage)} com responsavel ${lead.responsibleUser.fullName}.`}
        actions={
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink-950"
          >
            Editar lead
          </button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-4">
        {[
          { label: "Visitas vinculadas", value: lead.metrics.visitCount },
          { label: "Budget minimo", value: formatCurrency(lead.budgetMin) },
          { label: "Budget maximo", value: formatCurrency(lead.budgetMax) },
          { label: "Follow-up", value: formatDateTime(lead.nextFollowUpAt) },
        ].map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-2xl text-ink-950">{item.value}</p>
          </SectionCard>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Visao comercial">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Etapa</p>
              <div className="mt-2">
                <StatusBadge
                  label={getOptionLabel(saleLeadStageOptions, lead.pipelineStage)}
                  tone="brand"
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Status</p>
              <div className="mt-2">
                <StatusBadge
                  label={getOptionLabel(leadStatusOptions, lead.status)}
                  tone={resolveStatusTone(lead.status)}
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Origem</p>
              <p className="mt-2 text-sm text-ink-800">
                {getOptionLabel(leadSourceOptions, lead.source)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Responsavel</p>
              <p className="mt-2 text-sm text-ink-800">{lead.responsibleUser.fullName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Ultimo contato</p>
              <p className="mt-2 text-sm text-ink-800">{formatDateTime(lead.lastContactAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Criado em</p>
              <p className="mt-2 text-sm text-ink-800">{formatDateTime(lead.createdAt)}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Cliente e imovel">
          <div className="space-y-3 text-sm text-ink-700">
            <p>
              <span className="font-semibold text-ink-900">Email:</span>{" "}
              {lead.customerEmail ?? "Nao informado"}
            </p>
            <p>
              <span className="font-semibold text-ink-900">Telefone:</span>{" "}
              {lead.customerPhone ?? "Nao informado"}
            </p>
            <p>
              <span className="font-semibold text-ink-900">Documento:</span>{" "}
              {lead.customerDocument ?? "Nao informado"}
            </p>
            <p>
              <span className="font-semibold text-ink-900">Regiao:</span>{" "}
              {lead.desiredRegion ?? "Nao informada"}
            </p>
            <p>
              <span className="font-semibold text-ink-900">Imovel:</span>{" "}
              {lead.property
                ? `${lead.property.code} - ${lead.property.title}`
                : "Nao vinculado"}
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Observacoes do lead">
        <p className="text-sm text-ink-700">{lead.notes ?? "Sem observacoes registradas."}</p>
        {lead.lossReason ? (
          <div className="mt-4 rounded-2xl bg-sand-50 px-4 py-4 text-sm text-ink-700">
            {lead.lossReason}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Historico de visitas">
        <div className="space-y-3">
          {lead.visits.length ? (
            lead.visits.map((visit) => (
              <div key={visit.id} className="rounded-2xl border border-ink-200 bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink-900">{formatDateTime(visit.scheduledAt)}</p>
                    <p className="mt-1 text-sm text-ink-500">Corretor: {visit.broker.fullName}</p>
                    {visit.resultSummary ? (
                      <p className="mt-2 text-sm text-ink-600">{visit.resultSummary}</p>
                    ) : null}
                  </div>
                  <StatusBadge
                    label={visit.outcome ?? visit.status}
                    tone={resolveStatusTone(visit.outcome ?? visit.status)}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50 px-4 py-4 text-sm text-ink-500">
              Nenhuma visita registrada para este lead.
            </div>
          )}
        </div>
      </SectionCard>

      <SaleLeadFormDrawer
        open={drawerOpen}
        responsibleOptions={(usersQuery.data ?? []).map((user) => ({
          value: user.id,
          label: user.fullName,
        }))}
        propertyOptions={(propertiesQuery.data?.data ?? []).map((property) => ({
          value: property.id,
          label: `${property.code} - ${property.title}`,
        }))}
        initialData={lead}
        pending={updateMutation.isPending}
        onClose={() => setDrawerOpen(false)}
        onSubmit={async (values) => {
          await updateMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
