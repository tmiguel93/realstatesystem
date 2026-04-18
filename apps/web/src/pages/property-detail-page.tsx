import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useAuth } from "@/features/auth/auth-context";
import { PropertyFormDrawer } from "@/features/properties/property-form-drawer";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { resolveStatusTone } from "@/lib/status";
import { ownersService } from "@/services/owners-service";
import { propertiesService } from "@/services/properties-service";

export function PropertyDetailPage() {
  const { propertyId = "" } = useParams();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const propertyQuery = useQuery({
    queryKey: ["property-detail", propertyId],
    queryFn: () => propertiesService.getById(accessToken!, propertyId),
    enabled: Boolean(accessToken && propertyId),
  });

  const ownersQuery = useQuery({
    queryKey: ["owners-select"],
    queryFn: () =>
      ownersService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(accessToken),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof propertiesService.update>[2]) =>
      propertiesService.update(accessToken!, propertyId, payload),
    onSuccess: async () => {
      toast.success("Imovel atualizado.");
      setDrawerOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["property-detail", propertyId],
      });
      await queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  const property = propertyQuery.data;

  if (!property) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detalhe do imovel"
        title={`${property.code} · ${property.title}`}
        description={`${property.street}, ${property.streetNumber} · ${property.district} · ${property.city}/${property.state}`}
        actions={
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink-950"
          >
            Editar imovel
          </button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-4">
        {[
          { label: "Contratos", value: property.metrics.contractCount },
          { label: "Visitas", value: property.metrics.visitCount },
          { label: "Chaves", value: property.metrics.keyCount },
          { label: "Leads", value: property.metrics.saleLeadCount + property.metrics.rentLeadCount },
        ].map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-4xl text-ink-950">{item.value}</p>
          </SectionCard>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Visao geral">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Status</p>
              <div className="mt-2">
                <StatusBadge
                  label={property.status}
                  tone={resolveStatusTone(property.status)}
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Situacao comercial</p>
              <div className="mt-2">
                <StatusBadge
                  label={property.commercialSituation}
                  tone={resolveStatusTone(property.commercialSituation)}
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Finalidade</p>
              <p className="mt-2 text-sm text-ink-800">{property.purpose}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Tipo</p>
              <p className="mt-2 text-sm text-ink-800">{property.type}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Venda</p>
              <p className="mt-2 text-sm text-ink-800">{formatCurrency(property.salePrice)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Locacao</p>
              <p className="mt-2 text-sm text-ink-800">{formatCurrency(property.rentPrice)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Condominio</p>
              <p className="mt-2 text-sm text-ink-800">{formatCurrency(property.condoFee)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">IPTU</p>
              <p className="mt-2 text-sm text-ink-800">{formatCurrency(property.iptu)}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Proprietario">
          <div className="space-y-3">
            <p className="font-display text-2xl text-ink-950">
              {property.owner.fullName}
            </p>
            <p className="text-sm text-ink-500">{property.owner.document}</p>
            <p className="text-sm text-ink-600">
              {property.owner.email ?? "Sem email"} · {property.owner.phone ?? "Sem telefone"}
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Caracteristicas e observacoes">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700">
            Dormitorios: {property.bedrooms ?? "Nao informado"}
          </div>
          <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700">
            Banheiros: {property.bathrooms ?? "Nao informado"}
          </div>
          <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700">
            Vagas: {property.parkingSpots ?? "Nao informado"}
          </div>
          <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700">
            Area total: {property.areaTotal ?? "Nao informado"} m²
          </div>
          <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700">
            Area construida: {property.areaBuilt ?? "Nao informado"} m²
          </div>
          <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700">
            Mobiliado: {property.furnished ? "Sim" : "Nao"}
          </div>
        </div>
        {property.description ? (
          <p className="mt-5 text-sm text-ink-700">{property.description}</p>
        ) : null}
        {property.internalNotes ? (
          <div className="mt-4 rounded-2xl bg-sand-50 px-4 py-4 text-sm text-ink-700">
            {property.internalNotes}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Chaves cadastradas">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-ink-200 text-xs uppercase tracking-[0.18em] text-ink-400">
                <th className="pb-3">Identificador</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Responsavel atual</th>
                <th className="pb-3">Ultima retirada</th>
              </tr>
            </thead>
            <tbody>
              {property.propertyKeys.map((item) => (
                <tr key={item.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="py-4 font-semibold text-ink-900">{item.identifier}</td>
                  <td className="py-4">
                    <StatusBadge
                      label={item.currentStatus}
                      tone={resolveStatusTone(item.currentStatus)}
                    />
                  </td>
                  <td className="py-4 text-sm text-ink-600">
                    {item.currentHolderName ?? "Disponivel internamente"}
                  </td>
                  <td className="py-4 text-sm text-ink-600">
                    {formatDateTime(item.lastCheckoutAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Visitas recentes">
          <div className="space-y-3">
            {property.visits.map((visit) => (
              <div key={visit.id} className="rounded-2xl border border-ink-200 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink-900">
                      {formatDateTime(visit.scheduledAt)}
                    </p>
                    <p className="mt-1 text-sm text-ink-500">
                      Corretor: {visit.broker.fullName}
                    </p>
                  </div>
                  <StatusBadge
                    label={visit.status}
                    tone={resolveStatusTone(visit.status)}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Contratos relacionados">
          <div className="space-y-3">
            {property.contracts.map((contract) => (
              <div key={contract.id} className="rounded-2xl border border-ink-200 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink-900">{contract.code}</p>
                    <p className="mt-1 text-sm text-ink-500">
                      {contract.tenant.fullName} · {formatCurrency(contract.rentAmount)}
                    </p>
                  </div>
                  <StatusBadge
                    label={contract.status}
                    tone={resolveStatusTone(contract.status)}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <PropertyFormDrawer
        open={drawerOpen}
        initialData={property}
        ownerOptions={(ownersQuery.data?.data ?? []).map((owner) => ({
          value: owner.id,
          label: owner.fullName,
        }))}
        pending={updateMutation.isPending}
        onClose={() => setDrawerOpen(false)}
        onSubmit={async (values) => {
          await updateMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
