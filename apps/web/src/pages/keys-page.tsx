import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  History,
  KeyRound,
  Plus,
  Search,
} from "lucide-react";
import {
  keyActionOptions,
  keyStatusOptions,
  permissionCodes,
} from "@imobiliaria/shared";
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
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { getOptionLabel } from "@/lib/options";
import { resolveStatusTone } from "@/lib/status";
import { keysService } from "@/services/keys-service";
import { propertiesService } from "@/services/properties-service";
import type { PropertyKeyListItem, PropertyListItem } from "@/types/domain";

type CounterFilter = "ALL" | "AVAILABLE" | "CHECKED_OUT" | "OVERDUE" | "NO_KEY";

const counterFilters: Array<{
  value: CounterFilter;
  label: string;
  description: string;
}> = [
  { value: "ALL", label: "Todas", description: "Visão geral" },
  { value: "AVAILABLE", label: "Disponíveis", description: "No balcão" },
  { value: "CHECKED_OUT", label: "Fora", description: "Em posse" },
  { value: "OVERDUE", label: "Atrasadas", description: "Prazo vencido" },
  { value: "NO_KEY", label: "Sem chave", description: "Imóvel sem cadastro" },
];

function isAvailableKey(keyItem: PropertyKeyListItem) {
  return ["AVAILABLE", "COPY"].includes(keyItem.currentStatus);
}

function isUnavailableKey(keyItem: PropertyKeyListItem) {
  return ["UNDER_MAINTENANCE", "BLOCKED", "LOST"].includes(
    keyItem.currentStatus,
  );
}

function propertyAddress(property: PropertyKeyListItem["property"]) {
  return `${property.street}, ${property.streetNumber} · ${property.district}, ${property.city}`;
}

function listPropertyAddress(property: PropertyListItem) {
  return `${property.district}, ${property.city}`;
}

function resolveOperationalStatus(keyItem: PropertyKeyListItem) {
  if (keyItem.isOverdue) {
    return {
      label: "Atrasada",
      tone: "danger" as const,
      description: "Prazo de devolução vencido.",
      icon: AlertTriangle,
    };
  }

  if (keyItem.currentStatus === "CHECKED_OUT") {
    return {
      label: "Fora",
      tone: "warning" as const,
      description: "Chave em posse de terceiro.",
      icon: Clock3,
    };
  }

  if (isAvailableKey(keyItem)) {
    return {
      label: "Disponível",
      tone: "success" as const,
      description: "Pronta para retirada.",
      icon: CheckCircle2,
    };
  }

  return {
    label: "Indisponível",
    tone: "neutral" as const,
    description: getOptionLabel(keyStatusOptions, keyItem.currentStatus),
    icon: AlertTriangle,
  };
}

function filterKeys(keys: PropertyKeyListItem[], filter: CounterFilter) {
  if (filter === "AVAILABLE") {
    return keys.filter(isAvailableKey);
  }

  if (filter === "CHECKED_OUT") {
    return keys.filter((keyItem) => keyItem.currentStatus === "CHECKED_OUT");
  }

  if (filter === "OVERDUE") {
    return keys.filter((keyItem) => keyItem.isOverdue);
  }

  if (filter === "NO_KEY") {
    return [];
  }

  return keys;
}

export function KeysPage() {
  const queryClient = useQueryClient();
  const { accessToken, hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [counterFilter, setCounterFilter] = useState<CounterFilter>("ALL");
  const [propertyFilterId, setPropertyFilterId] = useState<string | null>(null);
  const [propertyFilterLabel, setPropertyFilterLabel] = useState<string | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<PropertyKeyListItem | null>(null);
  const [initialPropertyId, setInitialPropertyId] = useState<string | undefined>();

  const deferredSearch = useDeferredValue(search);
  const canWriteKeys = hasPermission(permissionCodes.KEYS_WRITE);
  const canOverrideKeys = hasPermission(permissionCodes.KEYS_OVERRIDE);

  const keysQuery = useQuery({
    queryKey: [
      "keys",
      page,
      deferredSearch,
      counterFilter,
      propertyFilterId,
    ],
    queryFn: () =>
      keysService.list({
        accessToken: accessToken!,
        page,
        pageSize: 8,
        search: deferredSearch || undefined,
        status:
          counterFilter === "CHECKED_OUT" ? "CHECKED_OUT" : undefined,
        propertyId: propertyFilterId ?? undefined,
        onlyOverdue: counterFilter === "OVERDUE" ? "true" : undefined,
      }),
    enabled: Boolean(accessToken),
  });

  const detailQuery = useQuery({
    queryKey: ["key-detail", selectedKeyId],
    queryFn: () => keysService.getById(accessToken!, selectedKeyId!),
    enabled: Boolean(accessToken && selectedKeyId),
  });

  const propertyOptionsQuery = useQuery({
    queryKey: ["properties-select"],
    queryFn: () =>
      propertiesService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(accessToken),
  });

  const propertySearchQuery = useQuery({
    queryKey: ["key-counter-properties", deferredSearch, counterFilter],
    queryFn: () =>
      propertiesService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 8,
        search: deferredSearch || undefined,
      }),
    enabled: Boolean(accessToken),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof keysService.create>[1]) =>
      keysService.create(accessToken!, payload),
    onSuccess: async () => {
      toast.success("Chave cadastrada com sucesso.");
      setCreateOpen(false);
      setInitialPropertyId(undefined);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["keys"] }),
        queryClient.invalidateQueries({ queryKey: ["properties-select"] }),
        queryClient.invalidateQueries({ queryKey: ["key-counter-properties"] }),
        queryClient.invalidateQueries({ queryKey: ["property-detail"] }),
      ]);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (payload: Parameters<typeof keysService.checkout>[2]) =>
      keysService.checkout(accessToken!, selectedKey!.id, payload),
    onSuccess: async () => {
      toast.success("Retirada registrada.");
      setCheckoutOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["keys"] }),
        queryClient.invalidateQueries({ queryKey: ["key-detail", selectedKey?.id] }),
      ]);
    },
  });

  const checkinMutation = useMutation({
    mutationFn: (payload: Parameters<typeof keysService.checkin>[2]) =>
      keysService.checkin(accessToken!, selectedKey!.id, payload),
    onSuccess: async () => {
      toast.success("Devolução registrada.");
      setCheckinOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["keys"] }),
        queryClient.invalidateQueries({ queryKey: ["key-detail", selectedKey?.id] }),
      ]);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (payload: Parameters<typeof keysService.changeStatus>[2]) =>
      keysService.changeStatus(accessToken!, selectedKey!.id, payload),
    onSuccess: async () => {
      toast.success("Status da chave atualizado.");
      setStatusOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["keys"] }),
        queryClient.invalidateQueries({ queryKey: ["key-detail", selectedKey?.id] }),
      ]);
    },
  });

  const keys = keysQuery.data?.data ?? [];
  const visibleKeys = filterKeys(keys, counterFilter);
  const selectedKeyDetail = detailQuery.data;
  const propertyOptions = (propertyOptionsQuery.data?.data ?? []).map(
    (property) => ({
      value: property.id,
      label: `${property.code} - ${property.title}`,
    }),
  );
  const propertyQuickResults = (propertySearchQuery.data?.data ?? [])
    .filter((property) =>
      counterFilter === "NO_KEY" ? property.keyCount === 0 : true,
    )
    .slice(0, 6);

  const metrics = useMemo(
    () => ({
      available: keys.filter(isAvailableKey).length,
      checkedOut: keys.filter((item) => item.currentStatus === "CHECKED_OUT")
        .length,
      overdue: keys.filter((item) => item.isOverdue).length,
      unavailable: keys.filter(isUnavailableKey).length,
    }),
    [keys],
  );
  const metricCards: Array<{
    label: string;
    value: number;
    tone: "success" | "warning" | "danger" | "neutral";
  }> = [
    { label: "Disponíveis", value: metrics.available, tone: "success" },
    { label: "Fora", value: metrics.checkedOut, tone: "warning" },
    { label: "Atrasadas", value: metrics.overdue, tone: "danger" },
    { label: "Indisponíveis", value: metrics.unavailable, tone: "neutral" },
  ];

  function selectKey(keyItem: PropertyKeyListItem) {
    setSelectedKey(keyItem);
    setSelectedKeyId(keyItem.id);
  }

  function openCreateForProperty(propertyId?: string) {
    setInitialPropertyId(propertyId);
    setCreateOpen(true);
  }

  function openCheckout(keyItem: PropertyKeyListItem) {
    selectKey(keyItem);
    setCheckoutOpen(true);
  }

  function openCheckin(keyItem: PropertyKeyListItem) {
    selectKey(keyItem);
    setCheckinOpen(true);
  }

  function openStatus(keyItem: PropertyKeyListItem) {
    selectKey(keyItem);
    setStatusOpen(true);
  }

  function focusProperty(property: PropertyListItem) {
    setPropertyFilterId(property.id);
    setPropertyFilterLabel(`${property.code} - ${property.title}`);
    setCounterFilter("ALL");
    setPage(1);
    setSelectedKey(null);
    setSelectedKeyId(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Controle operacional"
        title="Chaves em modo balcão"
        description="Busque o imóvel, veja o status da chave e registre retirada ou devolução em poucos cliques."
        actions={
          canWriteKeys ? (
            <button
              type="button"
              onClick={() => openCreateForProperty()}
              className="secondary-button"
            >
              <Plus size={18} />
              Nova chave
            </button>
          ) : null
        }
      />

      <SectionCard>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="flex items-center gap-3 rounded-[28px] border border-brand-100 bg-white/84 px-5 py-4 shadow-[0_22px_48px_-34px_rgba(24,57,48,0.38)]">
              <Search className="text-brand-700" size={22} />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                  setPropertyFilterId(null);
                  setPropertyFilterLabel(null);
                }}
                placeholder="Buscar por imóvel, endereço, chave, portador ou documento"
                className="w-full bg-transparent text-lg font-semibold text-ink-950 outline-none placeholder:text-ink-400"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {counterFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => {
                    setCounterFilter(filter.value);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left transition duration-200",
                    counterFilter === filter.value
                      ? "border-brand-300 bg-brand-50 text-brand-800 shadow-[0_16px_34px_-30px_rgba(34,109,87,0.46)]"
                      : "border-ink-200 bg-white/72 text-ink-600 hover:border-brand-200 hover:text-ink-900",
                  )}
                >
                  <span className="block text-sm font-semibold">
                    {filter.label}
                  </span>
                  <span className="block text-xs text-current/70">
                    {filter.description}
                  </span>
                </button>
              ))}
            </div>

            {propertyFilterLabel ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-sand-200 bg-sand-50/80 px-4 py-3 text-sm text-sand-800">
                <span>
                  Filtro de imóvel ativo:{" "}
                  <strong>{propertyFilterLabel}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPropertyFilterId(null);
                    setPropertyFilterLabel(null);
                  }}
                  className="rounded-xl bg-white/80 px-3 py-1 font-semibold"
                >
                  Limpar
                </button>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {metricCards.map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-ink-100 bg-white/78 px-4 py-4"
              >
                <StatusBadge label={item.label} tone={item.tone} />
                <p className="mt-3 font-display text-3xl text-ink-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <div className="space-y-5">
          <SectionCard
            title={
              counterFilter === "NO_KEY"
                ? "Imóveis sem chave cadastrada"
                : "Resultado rápido do imóvel"
            }
            description="Use estes cartões para localizar imóvel pelo ID, endereço ou nome comercial antes de movimentar a chave."
          >
            {propertyQuickResults.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {propertyQuickResults.map((property) => (
                  <div
                    key={property.id}
                    className="rounded-[24px] border border-ink-100 bg-white/82 p-4 shadow-[0_16px_34px_-30px_rgba(23,33,31,0.35)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-ink-400">
                          {property.code}
                        </p>
                        <h3 className="mt-2 font-display text-xl text-ink-950">
                          {property.title}
                        </h3>
                        <p className="mt-1 text-sm text-ink-500">
                          {listPropertyAddress(property)}
                        </p>
                      </div>
                      <StatusBadge
                        label={
                          property.keyCount > 0
                            ? `${property.keyCount} chave(s)`
                            : "Sem chave"
                        }
                        tone={property.keyCount > 0 ? "brand" : "danger"}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {property.keyCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => focusProperty(property)}
                          className="secondary-button"
                        >
                          Ver chaves
                        </button>
                      ) : canWriteKeys ? (
                        <button
                          type="button"
                          onClick={() => openCreateForProperty(property.id)}
                          className="primary-button"
                        >
                          Registrar chave recebida
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhum imóvel encontrado"
                description="Digite o código, endereço ou nome do imóvel para localizar rapidamente o cadastro."
              />
            )}
          </SectionCard>

          <SectionCard
            title="Chaves encontradas"
            description="Cada card mostra a próxima ação operacional recomendada para o balcão."
          >
            {keysQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="skeleton-shimmer h-32 rounded-[26px] border border-ink-100 bg-white/78"
                  />
                ))}
              </div>
            ) : visibleKeys.length ? (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {visibleKeys.map((keyItem) => {
                    const status = resolveOperationalStatus(keyItem);
                    const StatusIcon = status.icon;

                    return (
                      <button
                        key={keyItem.id}
                        type="button"
                        onClick={() => selectKey(keyItem)}
                        className={cn(
                          "group rounded-[28px] border p-5 text-left transition duration-200 hover:-translate-y-1",
                          selectedKeyId === keyItem.id
                            ? "border-brand-300 bg-brand-50/80 shadow-[0_22px_48px_-34px_rgba(34,109,87,0.5)]"
                            : keyItem.isOverdue
                              ? "border-rose-200 bg-rose-50/55 shadow-[0_22px_48px_-36px_rgba(190,18,60,0.35)]"
                              : "border-ink-100 bg-white/84 shadow-[0_20px_42px_-34px_rgba(23,33,31,0.34)]",
                        )}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="grid size-12 place-items-center rounded-2xl bg-ink-950 text-white">
                              <KeyRound size={20} />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-display text-2xl text-ink-950">
                                  {keyItem.identifier}
                                </h3>
                                {keyItem.isCopy ? (
                                  <StatusBadge label="Cópia" tone="neutral" />
                                ) : null}
                              </div>
                              <p className="mt-1 font-semibold text-ink-700">
                                {keyItem.property.code} · {keyItem.property.title}
                              </p>
                              <p className="mt-1 text-sm text-ink-500">
                                {propertyAddress(keyItem.property)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-start gap-3 lg:items-end">
                            <div className="flex items-center gap-2">
                              <StatusIcon size={18} className="text-ink-500" />
                              <StatusBadge label={status.label} tone={status.tone} />
                            </div>
                            <p className="max-w-sm text-sm text-ink-500 lg:text-right">
                              {status.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                          <div className="rounded-2xl bg-white/72 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
                              Portador
                            </p>
                            <p className="mt-1 font-semibold text-ink-800">
                              {keyItem.currentHolderName ?? "Base interna"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white/72 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
                              Previsão
                            </p>
                            <p className="mt-1 font-semibold text-ink-800">
                              {formatDateTime(keyItem.expectedReturnAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-start gap-2 rounded-2xl bg-white/72 px-4 py-3 md:justify-end">
                            {canWriteKeys && isAvailableKey(keyItem) ? (
                              <span
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openCheckout(keyItem);
                                }}
                                className="rounded-2xl bg-ink-950 px-4 py-2 text-sm font-semibold text-white"
                              >
                                Retirar
                              </span>
                            ) : null}
                            {canWriteKeys &&
                            keyItem.currentStatus === "CHECKED_OUT" ? (
                              <span
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openCheckin(keyItem);
                                }}
                                className="rounded-2xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
                              >
                                Devolver
                              </span>
                            ) : null}
                            <span className="rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700">
                              Ver histórico
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <PaginationControls
                  page={keysQuery.data?.meta.page ?? page}
                  totalPages={keysQuery.data?.meta.totalPages ?? 1}
                  onPageChange={setPage}
                />
              </div>
            ) : (
              <EmptyState
                title={
                  counterFilter === "NO_KEY"
                    ? "Use os cartões de imóveis acima"
                    : "Nenhuma chave encontrada"
                }
                description={
                  counterFilter === "NO_KEY"
                    ? "Imóveis sem chave aparecem no resultado rápido para cadastro imediato."
                    : "Ajuste a busca ou registre uma chave recebida para este imóvel."
                }
                action={
                  canWriteKeys ? (
                    <button
                      type="button"
                      onClick={() => openCreateForProperty()}
                      className="primary-button"
                    >
                      Registrar chave recebida
                    </button>
                  ) : null
                }
              />
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Atendimento atual"
          description="Resumo, ação principal e histórico sem sair da tela."
          actions={
            selectedKeyDetail ? (
              <div className="flex flex-wrap gap-2">
                {canWriteKeys && isAvailableKey(selectedKeyDetail) ? (
                  <button
                    type="button"
                    onClick={() => openCheckout(selectedKeyDetail)}
                    className="secondary-button"
                  >
                    Retirar
                  </button>
                ) : null}
                {canWriteKeys &&
                selectedKeyDetail.currentStatus === "CHECKED_OUT" ? (
                  <button
                    type="button"
                    onClick={() => openCheckin(selectedKeyDetail)}
                    className="secondary-button"
                  >
                    Devolver
                  </button>
                ) : null}
                {canWriteKeys ? (
                  <button
                    type="button"
                    onClick={() => openStatus(selectedKeyDetail)}
                    className="secondary-button"
                  >
                    Status
                  </button>
                ) : null}
              </div>
            ) : null
          }
        >
          {selectedKeyDetail ? (
            <div className="space-y-5">
              <div className="rounded-[28px] border border-ink-100 bg-white/80 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-ink-400">
                      Chave selecionada
                    </p>
                    <h2 className="mt-2 font-display text-3xl text-ink-950">
                      {selectedKeyDetail.identifier}
                    </h2>
                    <p className="mt-2 text-sm text-ink-500">
                      {selectedKeyDetail.property.code} ·{" "}
                      {selectedKeyDetail.property.title}
                    </p>
                  </div>
                  <StatusBadge
                    label={resolveOperationalStatus(selectedKeyDetail).label}
                    tone={resolveOperationalStatus(selectedKeyDetail).tone}
                  />
                </div>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl bg-ink-50 px-4 py-3 text-sm text-ink-700">
                    <strong>Endereço:</strong>{" "}
                    {propertyAddress(selectedKeyDetail.property)}
                  </div>
                  <div className="rounded-2xl bg-ink-50 px-4 py-3 text-sm text-ink-700">
                    <strong>Portador atual:</strong>{" "}
                    {selectedKeyDetail.currentHolderName ?? "Base interna"}
                  </div>
                  <div className="rounded-2xl bg-ink-50 px-4 py-3 text-sm text-ink-700">
                    <strong>Previsão de devolução:</strong>{" "}
                    {formatDateTime(selectedKeyDetail.expectedReturnAt)}
                  </div>
                </div>

                {selectedKeyDetail.isOverdue ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    Esta chave está atrasada. A ação recomendada é confirmar a
                    devolução ou registrar contato operacional no histórico.
                  </div>
                ) : null}
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <History size={18} className="text-brand-700" />
                  <h3 className="font-display text-xl text-ink-950">
                    Histórico de movimentação
                  </h3>
                </div>

                <div className="space-y-3">
                  {selectedKeyDetail.history.length ? (
                    selectedKeyDetail.history.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-ink-100 bg-white/82 px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-ink-900">
                              {getOptionLabel(keyActionOptions, item.action)}
                            </p>
                            <p className="mt-1 text-sm text-ink-500">
                              {item.responsibleUser?.fullName ?? "Sistema"} ·{" "}
                              {formatDateTime(item.createdAt)}
                            </p>
                          </div>
                          <StatusBadge
                            label={getOptionLabel(
                              keyStatusOptions,
                              item.resultingStatus,
                            )}
                            tone={resolveStatusTone(item.resultingStatus)}
                          />
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-ink-600">
                          <p>Portador: {item.holderName ?? "Não informado"}</p>
                          <p>Retirada: {formatDateTime(item.checkoutAt)}</p>
                          <p>
                            Previsão: {formatDateTime(item.expectedReturnAt)}
                          </p>
                          <p>Devolução: {formatDateTime(item.returnedAt)}</p>
                        </div>

                        {item.notes ? (
                          <p className="mt-3 whitespace-pre-line rounded-2xl bg-ink-50 px-3 py-3 text-sm text-ink-700">
                            {item.notes}
                          </p>
                        ) : null}
                        {item.overrideReason ? (
                          <p className="mt-3 rounded-2xl bg-sand-50 px-3 py-3 text-sm text-sand-800">
                            Override: {item.overrideReason}
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50 px-4 py-4 text-sm text-ink-500">
                      Ainda não há histórico operacional para esta chave.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Nenhum atendimento selecionado"
              description="Clique em uma chave encontrada para ver ação principal, detalhes e histórico."
            />
          )}
        </SectionCard>
      </div>

      <KeyFormDrawer
        open={createOpen}
        propertyOptions={propertyOptions}
        initialPropertyId={initialPropertyId}
        pending={createMutation.isPending}
        onClose={() => {
          setCreateOpen(false);
          setInitialPropertyId(undefined);
        }}
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
      />

      <KeyCheckoutDrawer
        open={checkoutOpen}
        keyItem={selectedKey}
        canOverride={canOverrideKeys}
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
        canOverride={canOverrideKeys}
        pending={statusMutation.isPending}
        onClose={() => setStatusOpen(false)}
        onSubmit={async (values) => {
          await statusMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
