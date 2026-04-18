import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  appRoutes,
  propertyPurposeOptions,
  propertyStatusOptions,
} from "@imobiliaria/shared";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { PaginationControls } from "@/components/navigation/pagination-controls";
import { useAuth } from "@/features/auth/auth-context";
import { PropertyFormDrawer } from "@/features/properties/property-form-drawer";
import { buildDetailPath, formatCurrency } from "@/lib/format";
import { resolveStatusTone } from "@/lib/status";
import { ownersService } from "@/services/owners-service";
import { propertiesService } from "@/services/properties-service";
import type { PropertyListItem } from "@/types/domain";

export function PropertiesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListItem | null>(
    null,
  );

  const deferredSearch = useDeferredValue(search);

  const propertiesQuery = useQuery({
    queryKey: ["properties", page, deferredSearch, statusFilter, purposeFilter],
    queryFn: () =>
      propertiesService.list({
        accessToken: accessToken!,
        page,
        pageSize: 10,
        search: deferredSearch || undefined,
        status: statusFilter || undefined,
        purpose: purposeFilter || undefined,
      }),
    enabled: Boolean(accessToken),
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

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof propertiesService.create>[1]) =>
      propertiesService.create(accessToken!, payload),
    onSuccess: async () => {
      toast.success("Imovel cadastrado com sucesso.");
      setDrawerOpen(false);
      setSelectedProperty(null);
      await queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof propertiesService.update>[2]) =>
      propertiesService.update(accessToken!, selectedProperty!.id, payload),
    onSuccess: async () => {
      toast.success("Imovel atualizado com sucesso.");
      setDrawerOpen(false);
      setSelectedProperty(null);
      await queryClient.invalidateQueries({ queryKey: ["properties"] });
      await queryClient.invalidateQueries({
        queryKey: ["property-detail", selectedProperty?.id],
      });
    },
  });

  const metrics = useMemo(() => {
    const properties = propertiesQuery.data?.data ?? [];
    return {
      available: properties.filter((item) => item.status === "AVAILABLE").length,
      rentedOrSold: properties.filter((item) =>
        ["RENTED", "SOLD"].includes(item.status),
      ).length,
      published: properties.filter((item) => item.isPublished).length,
    };
  }, [propertiesQuery.data]);

  const ownerOptions = (ownersQuery.data?.data ?? []).map((owner) => ({
    value: owner.id,
    label: owner.fullName,
  }));

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cadastro de ativos"
        title="Imoveis"
        description="Controle disponibilidade, finalidade, proprietario, valores e atributos de cada ativo comercial."
        actions={
          <button
            type="button"
            onClick={() => {
              setSelectedProperty(null);
              setDrawerOpen(true);
            }}
            className="secondary-button"
          >
            Novo imovel
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Disponiveis", value: metrics.available },
          { label: "Alugados ou vendidos", value: metrics.rentedOrSold },
          { label: "Publicados", value: metrics.published },
        ].map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-4xl text-ink-950">{item.value}</p>
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Portfolio administrado"
        description="Liste ativos por finalidade, status comercial e contexto geografico."
      >
        <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por codigo, titulo, rua ou bairro"
            className="filter-control"
          />
          <select
            value={purposeFilter}
            onChange={(event) => {
              setPurposeFilter(event.target.value);
              setPage(1);
            }}
            className="filter-control"
          >
            <option value="">Todas as finalidades</option>
            {propertyPurposeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="filter-control"
          >
            <option value="">Todos os status</option>
            {propertyStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {propertiesQuery.data?.data.length ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-ink-200 text-xs uppercase tracking-[0.18em] text-ink-400">
                    <th className="pb-3">Codigo</th>
                    <th className="pb-3">Imovel</th>
                    <th className="pb-3">Proprietario</th>
                    <th className="pb-3">Finalidade</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Valores</th>
                    <th className="pb-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {propertiesQuery.data.data.map((property) => (
                    <tr
                      key={property.id}
                      className="border-b border-ink-100 last:border-b-0"
                    >
                      <td className="py-4 text-sm font-semibold text-ink-900">
                        {property.code}
                      </td>
                      <td className="py-4">
                        <p className="font-semibold text-ink-900">{property.title}</p>
                        <p className="text-sm text-ink-500">
                          {property.district}, {property.city}
                        </p>
                      </td>
                      <td className="py-4 text-sm text-ink-600">
                        {property.owner.fullName}
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
                      <td className="py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                buildDetailPath(
                                  appRoutes.propertyDetail,
                                  property.id,
                                ),
                              )
                            }
                            className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700"
                          >
                            Detalhes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProperty(property);
                              setDrawerOpen(true);
                            }}
                            className="rounded-2xl bg-ink-950 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationControls
              page={propertiesQuery.data.meta.page}
              totalPages={propertiesQuery.data.meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : (
          <EmptyState
            title="Nenhum imovel encontrado"
            description="Cadastre um ativo para organizar o portfolio comercial da imobiliaria."
            action={
              <button
                type="button"
                onClick={() => {
                  setSelectedProperty(null);
                  setDrawerOpen(true);
                }}
                className="primary-button"
              >
                Cadastrar imovel
              </button>
            }
          />
        )}
      </SectionCard>

      <PropertyFormDrawer
        open={drawerOpen}
        initialData={selectedProperty}
        ownerOptions={ownerOptions}
        pending={pending}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedProperty(null);
        }}
        onSubmit={async (values) => {
          if (selectedProperty) {
            await updateMutation.mutateAsync(values);
            return;
          }

          await createMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
