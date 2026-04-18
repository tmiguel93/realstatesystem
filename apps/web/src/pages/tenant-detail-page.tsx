import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useAuth } from "@/features/auth/auth-context";
import { TenantFormDrawer } from "@/features/tenants/tenant-form-drawer";
import { formatCurrency, formatDate } from "@/lib/format";
import { resolveStatusTone } from "@/lib/status";
import { tenantsService } from "@/services/tenants-service";

export function TenantDetailPage() {
  const { tenantId = "" } = useParams();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const tenantQuery = useQuery({
    queryKey: ["tenant-detail", tenantId],
    queryFn: () => tenantsService.getById(accessToken!, tenantId),
    enabled: Boolean(accessToken && tenantId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof tenantsService.update>[2]) =>
      tenantsService.update(accessToken!, tenantId, payload),
    onSuccess: async () => {
      toast.success("Cadastro atualizado.");
      setDrawerOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["tenant-detail", tenantId] });
      await queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });

  const tenant = tenantQuery.data;

  if (!tenant) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detalhe do locatario"
        title={tenant.fullName}
        description={`Score ${tenant.scoreStatus}${tenant.scoreValue ? ` · ${tenant.scoreValue}` : ""}. Cadastro criado em ${formatDate(tenant.createdAt)}.`}
        actions={
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink-950"
          >
            Editar cadastro
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <SectionCard title="Dados principais" description="Contato, endereco e status cadastral do locatario.">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Status cadastral</p>
              <div className="mt-2">
                <StatusBadge
                  label={
                    tenant.scoreValue !== null
                      ? `${tenant.scoreStatus} · ${tenant.scoreValue}`
                      : tenant.scoreStatus
                  }
                  tone={resolveStatusTone(tenant.scoreStatus)}
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Cadastro ativo</p>
              <div className="mt-2">
                <StatusBadge
                  label={tenant.isActive ? "Ativo" : "Inativo"}
                  tone={resolveStatusTone(tenant.isActive ? "ACTIVE" : "INACTIVE")}
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Email</p>
              <p className="mt-2 text-sm text-ink-800">{tenant.email ?? "Nao informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Telefone</p>
              <p className="mt-2 text-sm text-ink-800">{tenant.phone ?? "Nao informado"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Endereco</p>
              <p className="mt-2 text-sm text-ink-800">
                {[tenant.street, tenant.streetNumber, tenant.district, tenant.city, tenant.state]
                  .filter(Boolean)
                  .join(", ") || "Nao informado"}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Resumo relacional">
          <div className="space-y-4">
            <div className="rounded-2xl bg-ink-50 px-4 py-4">
              <p className="text-sm text-ink-500">Contratos vinculados</p>
              <p className="mt-2 font-display text-3xl text-ink-950">
                {tenant.contractCount}
              </p>
            </div>
            <div className="rounded-2xl bg-ink-50 px-4 py-4">
              <p className="text-sm text-ink-500">Leads de locacao</p>
              <p className="mt-2 font-display text-3xl text-ink-950">
                {tenant.rentLeadCount}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Historico contratual">
        <div className="overflow-x-auto">
              <table className="data-table">
            <thead>
              <tr className="border-b border-ink-200 text-xs uppercase tracking-[0.18em] text-ink-400">
                <th className="pb-3">Contrato</th>
                <th className="pb-3">Imovel</th>
                <th className="pb-3">Locador</th>
                <th className="pb-3">Vigencia</th>
                <th className="pb-3">Aluguel</th>
              </tr>
            </thead>
            <tbody>
              {tenant.contracts.map((contract) => (
                <tr key={contract.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="py-4">
                    <p className="font-semibold text-ink-900">{contract.code}</p>
                    <p className="text-sm text-ink-500">{contract.status}</p>
                  </td>
                  <td className="py-4 text-sm text-ink-600">
                    {contract.property.code} · {contract.property.title}
                  </td>
                  <td className="py-4 text-sm text-ink-600">{contract.owner.fullName}</td>
                  <td className="py-4 text-sm text-ink-600">
                    {formatDate(contract.startDate)} ate {formatDate(contract.endDate)}
                  </td>
                  <td className="py-4 text-sm text-ink-600">
                    {formatCurrency(contract.rentAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Leads de locacao vinculados">
        <div className="overflow-x-auto">
              <table className="data-table">
            <thead>
              <tr className="border-b border-ink-200 text-xs uppercase tracking-[0.18em] text-ink-400">
                <th className="pb-3">Codigo</th>
                <th className="pb-3">Etapa</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Imovel</th>
              </tr>
            </thead>
            <tbody>
              {tenant.rentLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="py-4 font-semibold text-ink-900">{lead.code}</td>
                  <td className="py-4 text-sm text-ink-600">{lead.pipelineStage}</td>
                  <td className="py-4">
                    <StatusBadge
                      label={lead.status}
                      tone={resolveStatusTone(lead.status)}
                    />
                  </td>
                  <td className="py-4 text-sm text-ink-600">
                    {lead.property
                      ? `${lead.property.code} · ${lead.property.title}`
                      : "Nao vinculado"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <TenantFormDrawer
        open={drawerOpen}
        initialData={tenant}
        pending={updateMutation.isPending}
        onClose={() => setDrawerOpen(false)}
        onSubmit={async (values) => {
          await updateMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
