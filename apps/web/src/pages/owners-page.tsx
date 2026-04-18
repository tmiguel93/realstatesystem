import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { appRoutes } from "@imobiliaria/shared";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { PaginationControls } from "@/components/navigation/pagination-controls";
import { useAuth } from "@/features/auth/auth-context";
import { OwnerFormDrawer } from "@/features/owners/owner-form-drawer";
import { buildDetailPath } from "@/lib/format";
import { resolveStatusTone } from "@/lib/status";
import { ownersService } from "@/services/owners-service";
import type { OwnerListItem } from "@/types/domain";

export function OwnersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<OwnerListItem | null>(null);

  const deferredSearch = useDeferredValue(search);

  const ownersQuery = useQuery({
    queryKey: ["owners", page, deferredSearch, statusFilter],
    queryFn: () =>
      ownersService.list({
        accessToken: accessToken!,
        page,
        pageSize: 10,
        search: deferredSearch || undefined,
        isActive: statusFilter || undefined,
      }),
    enabled: Boolean(accessToken),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof ownersService.create>[1]) =>
      ownersService.create(accessToken!, payload),
    onSuccess: async () => {
      toast.success("Proprietario cadastrado com sucesso.");
      setDrawerOpen(false);
      setSelectedOwner(null);
      await queryClient.invalidateQueries({ queryKey: ["owners"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof ownersService.update>[2]) =>
      ownersService.update(accessToken!, selectedOwner!.id, payload),
    onSuccess: async () => {
      toast.success("Proprietario atualizado com sucesso.");
      setDrawerOpen(false);
      setSelectedOwner(null);
      await queryClient.invalidateQueries({ queryKey: ["owners"] });
      await queryClient.invalidateQueries({
        queryKey: ["owner-detail", selectedOwner?.id],
      });
    },
  });

  const metrics = useMemo(() => {
    const owners = ownersQuery.data?.data ?? [];
    return {
      active: owners.filter((item) => item.isActive).length,
      inactive: owners.filter((item) => !item.isActive).length,
      properties: owners.reduce((acc, item) => acc + item.propertyCount, 0),
    };
  }, [ownersQuery.data]);

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cadastros centrais"
        title="Proprietarios"
        description="Gerencie documentos, contato, dados bancarios e a carteira de ativos vinculados a cada locador."
        actions={
          <button
            type="button"
            onClick={() => {
              setSelectedOwner(null);
              setDrawerOpen(true);
            }}
            className="secondary-button"
          >
            Novo proprietario
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Ativos", value: metrics.active },
          { label: "Inativos", value: metrics.inactive },
          { label: "Imoveis vinculados", value: metrics.properties },
        ].map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-4xl text-ink-950">{item.value}</p>
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Lista administrativa"
        description="Use busca, status e navegacao para localizar rapidamente proprietarios e suas carteiras."
      >
        <div className="mb-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome, documento ou email"
            className="filter-control"
          />
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="filter-control"
          >
            <option value="">Todos os status</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>

        {ownersQuery.data?.data.length ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-ink-200 text-xs uppercase tracking-[0.18em] text-ink-400">
                    <th className="pb-3">Proprietario</th>
                    <th className="pb-3">Documento</th>
                    <th className="pb-3">Cidade</th>
                    <th className="pb-3">Ativos</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {ownersQuery.data.data.map((owner) => (
                    <tr key={owner.id} className="border-b border-ink-100 last:border-b-0">
                      <td className="py-4">
                        <p className="font-semibold text-ink-900">{owner.fullName}</p>
                        <p className="text-sm text-ink-500">{owner.email ?? "Sem email"}</p>
                      </td>
                      <td className="py-4 text-sm text-ink-600">{owner.document}</td>
                      <td className="py-4 text-sm text-ink-600">
                        {owner.city ?? "Nao informado"} / {owner.state ?? "--"}
                      </td>
                      <td className="py-4 text-sm text-ink-600">
                        {owner.propertyCount} imoveis
                      </td>
                      <td className="py-4">
                        <StatusBadge
                          label={owner.isActive ? "Ativo" : "Inativo"}
                          tone={resolveStatusTone(owner.isActive ? "ACTIVE" : "INACTIVE")}
                        />
                      </td>
                      <td className="py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                buildDetailPath(appRoutes.ownerDetail, owner.id),
                              )
                            }
                            className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700"
                          >
                            Detalhes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOwner(owner);
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
              page={ownersQuery.data.meta.page}
              totalPages={ownersQuery.data.meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : (
          <EmptyState
            title="Nenhum proprietario encontrado"
            description="Crie o primeiro cadastro para vincular imoveis e organizar a base locadora."
            action={
              <button
                type="button"
                onClick={() => {
                  setSelectedOwner(null);
                  setDrawerOpen(true);
                }}
                className="primary-button"
              >
                Cadastrar proprietario
              </button>
            }
          />
        )}
      </SectionCard>

      <OwnerFormDrawer
        open={drawerOpen}
        initialData={selectedOwner}
        pending={pending}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedOwner(null);
        }}
        onSubmit={async (values) => {
          if (selectedOwner) {
            await updateMutation.mutateAsync(values);
            return;
          }

          await createMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
