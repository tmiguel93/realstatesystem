import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useAuth } from "@/features/auth/auth-context";
import { OwnerFormDrawer } from "@/features/owners/owner-form-drawer";
import { formatCurrency, formatDate } from "@/lib/format";
import { resolveStatusTone } from "@/lib/status";
import { ownersService } from "@/services/owners-service";

export function OwnerDetailPage() {
  const { ownerId = "" } = useParams();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const ownerQuery = useQuery({
    queryKey: ["owner-detail", ownerId],
    queryFn: () => ownersService.getById(accessToken!, ownerId),
    enabled: Boolean(accessToken && ownerId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof ownersService.update>[2]) =>
      ownersService.update(accessToken!, ownerId, payload),
    onSuccess: async () => {
      toast.success("Cadastro atualizado.");
      setDrawerOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["owner-detail", ownerId] });
      await queryClient.invalidateQueries({ queryKey: ["owners"] });
    },
  });

  const owner = ownerQuery.data;

  if (!owner) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detalhe do proprietario"
        title={owner.fullName}
        description={`Documento ${owner.document}. Base criada em ${formatDate(owner.createdAt)}.`}
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
        <SectionCard title="Dados principais" description="Contato, endereco e status operacional.">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Status</p>
              <div className="mt-2">
                <StatusBadge
                  label={owner.isActive ? "Ativo" : "Inativo"}
                  tone={resolveStatusTone(owner.isActive ? "ACTIVE" : "INACTIVE")}
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Tipo</p>
              <p className="mt-2 text-sm text-ink-800">{owner.personType}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Email</p>
              <p className="mt-2 text-sm text-ink-800">{owner.email ?? "Nao informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Telefone</p>
              <p className="mt-2 text-sm text-ink-800">{owner.phone ?? "Nao informado"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Endereco</p>
              <p className="mt-2 text-sm text-ink-800">
                {[owner.street, owner.streetNumber, owner.district, owner.city, owner.state]
                  .filter(Boolean)
                  .join(", ") || "Nao informado"}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Resumo operacional">
          <div className="space-y-4">
            <div className="rounded-2xl bg-ink-50 px-4 py-4">
              <p className="text-sm text-ink-500">Imoveis vinculados</p>
              <p className="mt-2 font-display text-3xl text-ink-950">
                {owner.propertyCount}
              </p>
            </div>
            <div className="rounded-2xl bg-ink-50 px-4 py-4">
              <p className="text-sm text-ink-500">Contratos no historico</p>
              <p className="mt-2 font-display text-3xl text-ink-950">
                {owner.contractCount}
              </p>
            </div>
            <div className="rounded-2xl bg-ink-50 px-4 py-4">
              <p className="text-sm text-ink-500">Pix</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">
                {owner.pixKey ?? "Nao informado"}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Imoveis vinculados">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-ink-200 text-xs uppercase tracking-[0.18em] text-ink-400">
                <th className="pb-3">Codigo</th>
                <th className="pb-3">Imovel</th>
                <th className="pb-3">Finalidade</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Valores</th>
              </tr>
            </thead>
            <tbody>
              {owner.properties.map((property) => (
                <tr key={property.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="py-4 text-sm font-semibold text-ink-900">{property.code}</td>
                  <td className="py-4">
                    <p className="font-semibold text-ink-900">{property.title}</p>
                    <p className="text-sm text-ink-500">
                      {property.district}, {property.city}
                    </p>
                  </td>
                  <td className="py-4 text-sm text-ink-600">{property.purpose}</td>
                  <td className="py-4">
                    <StatusBadge
                      label={property.status}
                      tone={resolveStatusTone(property.status)}
                    />
                  </td>
                  <td className="py-4 text-sm text-ink-600">
                    Venda: {formatCurrency(property.salePrice)}
                    <br />
                    Locacao: {formatCurrency(property.rentPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Historico contratual recente">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-ink-200 text-xs uppercase tracking-[0.18em] text-ink-400">
                <th className="pb-3">Contrato</th>
                <th className="pb-3">Locatario</th>
                <th className="pb-3">Imovel</th>
                <th className="pb-3">Vigencia</th>
                <th className="pb-3">Aluguel</th>
              </tr>
            </thead>
            <tbody>
              {owner.contracts.map((contract) => (
                <tr key={contract.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="py-4">
                    <p className="font-semibold text-ink-900">{contract.code}</p>
                    <p className="text-sm text-ink-500">{contract.status}</p>
                  </td>
                  <td className="py-4 text-sm text-ink-600">{contract.tenant.fullName}</td>
                  <td className="py-4 text-sm text-ink-600">
                    {contract.property.code} · {contract.property.title}
                  </td>
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

      <OwnerFormDrawer
        open={drawerOpen}
        initialData={owner}
        pending={updateMutation.isPending}
        onClose={() => setDrawerOpen(false)}
        onSubmit={async (values) => {
          await updateMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
