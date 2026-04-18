import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { keyActionOptions, keyStatusOptions } from "@imobiliaria/shared";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PaginationControls } from "@/components/navigation/pagination-controls";
import { useAuth } from "@/features/auth/auth-context";
import { KeyCheckinDrawer } from "@/features/keys/key-checkin-drawer";
import { KeyCheckoutDrawer } from "@/features/keys/key-checkout-drawer";
import { KeyFormDrawer } from "@/features/keys/key-form-drawer";
import { KeyStatusDrawer } from "@/features/keys/key-status-drawer";
import { formatDateTime } from "@/lib/format";
import { getOptionLabel } from "@/lib/options";
import { resolveStatusTone } from "@/lib/status";
import { keysService } from "@/services/keys-service";
import { propertiesService } from "@/services/properties-service";
import type { PropertyKeyListItem } from "@/types/domain";

export function KeysPage() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<PropertyKeyListItem | null>(null);

  const keysQuery = useQuery({
    queryKey: ["keys", page, search, statusFilter, onlyOverdue],
    queryFn: () =>
      keysService.list({
        accessToken: accessToken!,
        page,
        pageSize: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        onlyOverdue: onlyOverdue ? "true" : undefined,
      }),
    enabled: Boolean(accessToken),
  });

  const detailQuery = useQuery({
    queryKey: ["key-detail", selectedKeyId],
    queryFn: () => keysService.getById(accessToken!, selectedKeyId!),
    enabled: Boolean(accessToken && selectedKeyId),
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

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof keysService.create>[1]) =>
      keysService.create(accessToken!, payload),
    onSuccess: async () => {
      toast.success("Chave cadastrada com sucesso.");
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["keys"] });
      await queryClient.invalidateQueries({ queryKey: ["property-detail"] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (payload: Parameters<typeof keysService.checkout>[2]) =>
      keysService.checkout(accessToken!, selectedKey!.id, payload),
    onSuccess: async () => {
      toast.success("Retirada registrada.");
      setCheckoutOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["keys"] });
      if (selectedKeyId) {
        await queryClient.invalidateQueries({ queryKey: ["key-detail", selectedKeyId] });
      }
    },
  });

  const checkinMutation = useMutation({
    mutationFn: (payload: Parameters<typeof keysService.checkin>[2]) =>
      keysService.checkin(accessToken!, selectedKey!.id, payload),
    onSuccess: async () => {
      toast.success("Devolucao registrada.");
      setCheckinOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["keys"] });
      if (selectedKeyId) {
        await queryClient.invalidateQueries({ queryKey: ["key-detail", selectedKeyId] });
      }
    },
  });

  const statusMutation = useMutation({
    mutationFn: (payload: Parameters<typeof keysService.changeStatus>[2]) =>
      keysService.changeStatus(accessToken!, selectedKey!.id, payload),
    onSuccess: async () => {
      toast.success("Status da chave atualizado.");
      setStatusOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["keys"] });
      if (selectedKeyId) {
        await queryClient.invalidateQueries({ queryKey: ["key-detail", selectedKeyId] });
      }
    },
  });

  const keys = keysQuery.data?.data ?? [];
  const selectedKeyDetail = detailQuery.data;
  const propertyOptions = (propertiesQuery.data?.data ?? []).map((property) => ({
    value: property.id,
    label: `${property.code} - ${property.title}`,
  }));

  const metrics = useMemo(
    () => ({
      available: keys.filter((item) => ["AVAILABLE", "COPY"].includes(item.currentStatus)).length,
      checkedOut: keys.filter((item) => item.currentStatus === "CHECKED_OUT").length,
      overdue: keys.filter((item) => item.isOverdue).length,
    }),
    [keys],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Controle operacional"
        title="Chaves"
        description="Registre retirada, devolucao, manutencao e historico completo das chaves vinculadas aos imoveis."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-sand-50"
          >
            Nova chave
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Disponiveis", value: metrics.available },
          { label: "Em posse", value: metrics.checkedOut },
          { label: "Atrasadas", value: metrics.overdue },
        ].map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-4xl text-ink-950">{item.value}</p>
          </SectionCard>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <SectionCard
          title="Base de chaves"
          description="Monitore status, portador atual, prazo de devolucao e abra o historico detalhado ao lado."
        >
          <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por identificador, imovel ou portador"
              className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            >
              <option value="">Todos os status</option>
              {keyStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setOnlyOverdue((current) => !current);
                setPage(1);
              }}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                onlyOverdue
                  ? "border-brand-200 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-700"
              }`}
            >
              {onlyOverdue ? "Mostrando atrasadas" : "Filtrar atrasadas"}
            </button>
          </div>

          {keys.length ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-ink-200 text-xs uppercase tracking-[0.18em] text-ink-400">
                      <th className="pb-3">Chave</th>
                      <th className="pb-3">Imovel</th>
                      <th className="pb-3">Portador</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Prazo</th>
                      <th className="pb-3 text-right">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((keyItem) => (
                      <tr key={keyItem.id} className="border-b border-ink-100 last:border-b-0">
                        <td className="py-4">
                          <p className="font-semibold text-ink-900">{keyItem.identifier}</p>
                          <p className="text-sm text-ink-500">
                            {keyItem.isCopy ? "Copia registrada" : "Original"}
                          </p>
                        </td>
                        <td className="py-4 text-sm text-ink-600">
                          {keyItem.property.code} - {keyItem.property.title}
                        </td>
                        <td className="py-4 text-sm text-ink-600">
                          {keyItem.currentHolderName ?? "Base interna"}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              label={getOptionLabel(keyStatusOptions, keyItem.currentStatus)}
                              tone={resolveStatusTone(keyItem.currentStatus)}
                            />
                            {keyItem.isOverdue ? <StatusBadge label="Atrasada" tone="danger" /> : null}
                          </div>
                        </td>
                        <td className="py-4 text-sm text-ink-600">
                          {formatDateTime(keyItem.expectedReturnAt)}
                        </td>
                        <td className="py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedKeyId(keyItem.id)}
                              className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700"
                            >
                              Detalhes
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedKey(keyItem);
                                setCheckoutOpen(true);
                              }}
                              className="rounded-2xl bg-ink-950 px-3 py-2 text-sm font-semibold text-white"
                            >
                              Retirar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                page={keysQuery.data?.meta.page ?? page}
                totalPages={keysQuery.data?.meta.totalPages ?? 1}
                onPageChange={setPage}
              />
            </div>
          ) : (
            <EmptyState
              title="Nenhuma chave encontrada"
              description="Cadastre a primeira chave para controlar posse, manutencao e atraso."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Historico da chave"
          description="Selecione uma chave para revisar o historico completo e executar acoes operacionais."
          actions={
            selectedKeyDetail ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedKey(selectedKeyDetail);
                    setCheckoutOpen(true);
                  }}
                  className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700"
                >
                  Retirar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedKey(selectedKeyDetail);
                    setCheckinOpen(true);
                  }}
                  className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700"
                >
                  Devolver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedKey(selectedKeyDetail);
                    setStatusOpen(true);
                  }}
                  className="rounded-2xl bg-ink-950 px-3 py-2 text-sm font-semibold text-white"
                >
                  Status
                </button>
              </div>
            ) : null
          }
        >
          {selectedKeyDetail ? (
            <div className="space-y-4">
              <div className="rounded-3xl bg-ink-50 px-5 py-5">
                <p className="font-display text-2xl text-ink-950">{selectedKeyDetail.identifier}</p>
                <p className="mt-2 text-sm text-ink-500">
                  {selectedKeyDetail.property.code} - {selectedKeyDetail.property.title}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge
                    label={getOptionLabel(keyStatusOptions, selectedKeyDetail.currentStatus)}
                    tone={resolveStatusTone(selectedKeyDetail.currentStatus)}
                  />
                  {selectedKeyDetail.isOverdue ? <StatusBadge label="Atrasada" tone="danger" /> : null}
                </div>
              </div>
              <div className="space-y-2 text-sm text-ink-700">
                <p>
                  <span className="font-semibold text-ink-900">Portador atual:</span>{" "}
                  {selectedKeyDetail.currentHolderName ?? "Base interna"}
                </p>
                <p>
                  <span className="font-semibold text-ink-900">Retirada:</span>{" "}
                  {formatDateTime(selectedKeyDetail.lastCheckoutAt)}
                </p>
                <p>
                  <span className="font-semibold text-ink-900">Devolucao:</span>{" "}
                  {formatDateTime(selectedKeyDetail.lastCheckinAt)}
                </p>
              </div>
              <div className="space-y-3">
                {selectedKeyDetail.history.length ? (
                  selectedKeyDetail.history.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-ink-200 bg-white px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-ink-900">
                            {getOptionLabel(keyActionOptions, item.action)}
                          </p>
                          <p className="mt-1 text-sm text-ink-500">
                            {item.responsibleUser?.fullName ?? "Sistema"} - {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                        <StatusBadge
                          label={getOptionLabel(keyStatusOptions, item.resultingStatus)}
                          tone={resolveStatusTone(item.resultingStatus)}
                        />
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-ink-600">
                        <p>Portador: {item.holderName ?? "Nao informado"}</p>
                        <p>Checkout: {formatDateTime(item.checkoutAt)}</p>
                        <p>Devolucao prevista: {formatDateTime(item.expectedReturnAt)}</p>
                        <p>Devolucao real: {formatDateTime(item.returnedAt)}</p>
                      </div>
                      {item.notes ? (
                        <p className="mt-3 rounded-2xl bg-ink-50 px-3 py-3 text-sm text-ink-700">
                          {item.notes}
                        </p>
                      ) : null}
                      {item.overrideReason ? (
                        <p className="mt-3 rounded-2xl bg-sand-50 px-3 py-3 text-sm text-ink-700">
                          Override: {item.overrideReason}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50 px-4 py-4 text-sm text-ink-500">
                    Ainda nao ha historico operacional para esta chave.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Selecione uma chave"
              description="O historico completo aparece aqui quando voce abre um registro."
            />
          )}
        </SectionCard>
      </div>

      <KeyFormDrawer
        open={createOpen}
        propertyOptions={propertyOptions}
        pending={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
      />

      <KeyCheckoutDrawer
        open={checkoutOpen}
        keyItem={selectedKey}
        pending={checkoutMutation.isPending}
        onClose={() => setCheckoutOpen(false)}
        onSubmit={async (values) => {
          await checkoutMutation.mutateAsync(values);
        }}
      />

      <KeyCheckinDrawer
        open={checkinOpen}
        keyItem={selectedKey}
        pending={checkinMutation.isPending}
        onClose={() => setCheckinOpen(false)}
        onSubmit={async (values) => {
          await checkinMutation.mutateAsync(values);
        }}
      />

      <KeyStatusDrawer
        open={statusOpen}
        keyItem={selectedKey}
        pending={statusMutation.isPending}
        onClose={() => setStatusOpen(false)}
        onSubmit={async (values) => {
          await statusMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
