import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  appRoutes,
  propertyPurposeOptions,
  propertyStatusOptions,
} from "@imobiliaria/shared";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PaginationControls } from "@/components/navigation/pagination-controls";
import { useAuth } from "@/features/auth/auth-context";
import { PropertyFormDrawer } from "@/features/properties/property-form-drawer";
import { resolveAssetUrl } from "@/lib/assets";
import { buildDetailPath, formatCurrency } from "@/lib/format";
import { getOptionLabel } from "@/lib/options";
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
  const [withoutImagesOnly, setWithoutImagesOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListItem | null>(
    null,
  );

  const deferredSearch = useDeferredValue(search);

  const propertiesQuery = useQuery({
    queryKey: [
      "properties",
      page,
      deferredSearch,
      statusFilter,
      purposeFilter,
      withoutImagesOnly,
    ],
    queryFn: () =>
      propertiesService.list({
        accessToken: accessToken!,
        page,
        pageSize: 10,
        search: deferredSearch || undefined,
        status: statusFilter || undefined,
        purpose: purposeFilter || undefined,
        withoutImages: withoutImagesOnly || undefined,
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
      toast.success("Imóvel cadastrado com sucesso.");
      setDrawerOpen(false);
      setSelectedProperty(null);
      await queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof propertiesService.update>[2]) =>
      propertiesService.update(accessToken!, selectedProperty!.id, payload),
    onSuccess: async () => {
      toast.success("Imóvel atualizado com sucesso.");
      const currentId = selectedProperty?.id ?? null;
      setDrawerOpen(false);
      setSelectedProperty(null);
      await queryClient.invalidateQueries({ queryKey: ["properties"] });
      if (currentId) {
        await queryClient.invalidateQueries({
          queryKey: ["property-detail", currentId],
        });
      }
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
      withoutImages: propertiesQuery.data?.summary.withoutImages ?? 0,
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
        title="Imóveis"
        description="Controle disponibilidade, finalidade, proprietário, valores e atributos de cada ativo comercial."
        actions={
          <button
            type="button"
            onClick={() => {
              setSelectedProperty(null);
              setDrawerOpen(true);
            }}
            className="secondary-button"
          >
            Novo imóvel
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-4">
        {[
          { label: "Disponíveis", value: metrics.available },
          { label: "Alugados ou vendidos", value: metrics.rentedOrSold },
          { label: "Publicados", value: metrics.published },
          { label: "Sem foto", value: metrics.withoutImages },
        ].map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-4xl text-ink-950">{item.value}</p>
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Portfólio administrado"
        description="Liste ativos por finalidade, status comercial e contexto geográfico."
      >
        <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por código, título, rua ou bairro"
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
          <button
            type="button"
            onClick={() => {
              setWithoutImagesOnly((current) => !current);
              setPage(1);
            }}
            className={
              withoutImagesOnly
                ? "primary-button justify-center"
                : "secondary-button justify-center"
            }
          >
            Somente sem foto
          </button>
        </div>

        {propertiesQuery.data?.data.length ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Imóvel</th>
                    <th>Proprietário</th>
                    <th>Finalidade</th>
                    <th>Status</th>
                    <th>Valores</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {propertiesQuery.data.data.map((property) => (
                    <tr key={property.id}>
                      <td className="text-sm font-semibold text-ink-900">
                        {property.code}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-20 overflow-hidden rounded-2xl bg-ink-100">
                            {property.coverImageUrl ? (
                              <img
                                src={resolveAssetUrl(property.coverImageUrl) ?? property.coverImageUrl}
                                alt={property.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-xs text-ink-400">
                                Sem foto
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900">{property.title}</p>
                            <p className="text-sm text-ink-500">
                              {property.district}, {property.city}
                            </p>
                            <p className="mt-1 text-xs text-ink-400">
                              {property.imageCount > 0
                                ? `${property.imageCount} foto(s)`
                                : "Sem foto cadastrada"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-ink-600">
                        {property.owner.fullName}
                      </td>
                      <td className="text-sm text-ink-600">
                        {getOptionLabel(propertyPurposeOptions, property.purpose)}
                      </td>
                      <td>
                        <StatusBadge
                          label={getOptionLabel(propertyStatusOptions, property.status)}
                          tone={resolveStatusTone(property.status)}
                        />
                      </td>
                      <td className="text-sm text-ink-600">
                        Venda: {formatCurrency(property.salePrice)}
                        <br />
                        Locação: {formatCurrency(property.rentPrice)}
                      </td>
                      <td>
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
                            className="secondary-button px-3 py-2"
                          >
                            Abrir detalhe
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProperty(property);
                              setDrawerOpen(true);
                            }}
                            className="primary-button px-3 py-2"
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
            title={
              withoutImagesOnly
                ? "Nenhum imóvel sem foto"
                : "Nenhum imóvel encontrado"
            }
            description={
              withoutImagesOnly
                ? "Todos os imóveis deste filtro já possuem fotos cadastradas."
                : "Cadastre um ativo para organizar o portfólio comercial da imobiliária."
            }
            action={
              withoutImagesOnly ? undefined : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProperty(null);
                    setDrawerOpen(true);
                  }}
                  className="primary-button"
                >
                  Cadastrar imóvel
                </button>
              )
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
