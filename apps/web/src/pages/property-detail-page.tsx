import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  appRoutes,
  commercialSituationOptions,
  contractStatusOptions,
  keyActionOptions,
  keyStatusOptions,
  maintenanceTicketStatusOptions,
  maintenanceTicketTypeOptions,
  permissionCodes,
  propertyPurposeOptions,
  propertyStatusOptions,
  propertyTypeOptions,
  visitStatusOptions,
} from "@imobiliaria/shared";
import {
  Building2,
  CalendarClock,
  Camera,
  ClipboardList,
  FileText,
  History,
  Home,
  KeyRound,
  PlusCircle,
  Wrench,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useAuth } from "@/features/auth/auth-context";
import { PropertyImagesPanel } from "@/features/properties/property-images-panel";
import { PropertyFormDrawer } from "@/features/properties/property-form-drawer";
import { resolveAssetUrl } from "@/lib/assets";
import { buildDetailPath, formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { getOptionLabel } from "@/lib/options";
import { resolveStatusTone } from "@/lib/status";
import { ownersService } from "@/services/owners-service";
import { propertiesService } from "@/services/properties-service";

type Property360Section =
  | "resumo"
  | "fotos"
  | "operacao"
  | "contratos"
  | "historico"
  | "cadastro";

const property360Sections: Array<{
  id: Property360Section;
  label: string;
  icon: typeof Home;
}> = [
  { id: "resumo", label: "Visão geral", icon: Home },
  { id: "fotos", label: "Fotos", icon: Camera },
  { id: "operacao", label: "Operação", icon: ClipboardList },
  { id: "contratos", label: "Contratos", icon: FileText },
  { id: "historico", label: "Histórico", icon: History },
  { id: "cadastro", label: "Cadastro", icon: Building2 },
];

function getUrgencyTone(urgencyLevel: number) {
  if (urgencyLevel >= 5) {
    return "danger" as const;
  }

  if (urgencyLevel >= 3) {
    return "warning" as const;
  }

  return "brand" as const;
}

function getContactLine(contact?: {
  email?: string | null;
  phone?: string | null;
} | null) {
  if (!contact) {
    return "Contato não informado";
  }

  return [contact.email, contact.phone].filter(Boolean).join(" · ") || "Contato não informado";
}

export function PropertyDetailPage() {
  const { propertyId = "" } = useParams();
  const queryClient = useQueryClient();
  const { accessToken, hasPermission } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<Property360Section>("resumo");

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
      toast.success("Imóvel atualizado.");
      setDrawerOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["property-detail", propertyId],
      });
      await queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  const property = propertyQuery.data;
  const coverImageUrl = useMemo(() => {
    const cover = property?.propertyImages.find((image) => image.isCover);
    return resolveAssetUrl(
      cover?.fileUrl ?? property?.propertyImages[0]?.fileUrl ?? null,
    );
  }, [property]);

  const openMaintenanceTickets = useMemo(
    () =>
      property?.maintenanceTickets.filter(
        (ticket) => !["FINISHED", "CANCELLED"].includes(ticket.status),
      ) ?? [],
    [property?.maintenanceTickets],
  );

  const checkedOutKeys = useMemo(
    () =>
      property?.propertyKeys.filter(
        (key) => key.currentStatus === "CHECKED_OUT",
      ) ?? [],
    [property?.propertyKeys],
  );

  const recentHistory = useMemo(() => {
    if (!property) {
      return [];
    }

    return [
      ...property.visits.map((visit) => ({
        id: `visit-${visit.id}`,
        date: visit.scheduledAt,
        title: "Visita registrada",
        description: `${formatDateTime(visit.scheduledAt)} · ${visit.broker.fullName}`,
        status: getOptionLabel(visitStatusOptions, visit.status),
      })),
      ...property.contracts.map((contract) => ({
        id: `contract-${contract.id}`,
        date: contract.startDate,
        title: `Contrato ${contract.code}`,
        description: `${contract.tenant.fullName} · ${formatCurrency(contract.rentAmount)}`,
        status: getOptionLabel(contractStatusOptions, contract.status),
      })),
      ...property.maintenanceTickets.map((ticket) => ({
        id: `maintenance-${ticket.id}`,
        date: ticket.updatedAt,
        title: `Chamado ${ticket.ticketId}`,
        description: ticket.title,
        status: getOptionLabel(maintenanceTicketStatusOptions, ticket.status),
      })),
      ...property.keyControls.map((movement) => ({
        id: `key-${movement.id}`,
        date: movement.createdAt,
        title: `Chave ${movement.propertyKey.identifier}`,
        description:
          movement.holderName ??
          movement.responsibleUser?.fullName ??
          "Movimentação operacional",
        status: getOptionLabel(keyActionOptions, movement.action),
      })),
    ]
      .sort(
        (first, second) =>
          new Date(second.date).getTime() - new Date(first.date).getTime(),
      )
      .slice(0, 10);
  }, [property]);

  if (propertyQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Imóvel 360"
          title="Carregando imóvel"
          description="Buscando contexto patrimonial, galeria e histórico operacional."
        />
        <div className="grid gap-5 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="panel-card skeleton-shimmer h-36" />
          ))}
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <EmptyState
        title="Imóvel não encontrado"
        description="Não foi possível localizar o cadastro solicitado."
      />
    );
  }

  const canEditProperty = hasPermission(permissionCodes.PROPERTIES_WRITE);
  const canManageImages = hasPermission(permissionCodes.PROPERTY_IMAGES_WRITE);
  const canReadContracts = hasPermission(permissionCodes.CONTRACTS_READ);
  const canGenerateContracts = hasPermission(permissionCodes.CONTRACTS_GENERATE);
  const canReadKeys = hasPermission(permissionCodes.KEYS_READ);
  const canWriteKeys = hasPermission(permissionCodes.KEYS_WRITE);
  const canWriteVisits = hasPermission(permissionCodes.VISITS_WRITE);
  const canReadMaintenance = hasPermission(permissionCodes.MAINTENANCE_READ);
  const canWriteMaintenance = hasPermission(permissionCodes.MAINTENANCE_WRITE);

  const statusCards = [
    {
      label: "Status comercial",
      value: getOptionLabel(commercialSituationOptions, property.commercialSituation),
      tone: resolveStatusTone(property.commercialSituation),
    },
    {
      label: "Status do imóvel",
      value: getOptionLabel(propertyStatusOptions, property.status),
      tone: resolveStatusTone(property.status),
    },
    {
      label: "Locatário atual",
      value: property.activeTenant?.fullName ?? "Sem locatário ativo",
      tone: property.activeTenant ? "success" : "neutral",
    },
    {
      label: "Pendências operacionais",
      value: `${openMaintenanceTickets.length} chamado(s) · ${checkedOutKeys.length} chave(s) fora`,
      tone:
        openMaintenanceTickets.length || checkedOutKeys.length
          ? "warning"
          : "success",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Imóvel 360"
        title={`${property.code} · ${property.title}`}
        description={`${property.street}, ${property.streetNumber} · ${property.district} · ${property.city}/${property.state}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {canEditProperty ? (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="secondary-button bg-white/90"
              >
                Editar imóvel
              </button>
            ) : null}
            {property.activeContract && canReadContracts ? (
              <Link
                to={buildDetailPath(
                  appRoutes.contractDetail,
                  property.activeContract.id,
                )}
                className="secondary-button bg-white/90"
              >
                Ver contrato ativo
              </Link>
            ) : null}
          </div>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.6fr)]">
        <div className="overflow-hidden rounded-[32px] border border-ink-200 bg-[var(--elevated-bg)] shadow-soft">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={property.title}
              className="h-[340px] w-full object-cover"
            />
          ) : (
            <div className="grid h-[340px] place-items-center bg-[linear-gradient(135deg,rgb(var(--color-brand-50)),rgb(var(--color-sand-50)))] text-center">
              <div>
                <Camera className="mx-auto text-brand-600" size={38} />
                <p className="mt-4 font-display text-2xl text-ink-950">
                  Imóvel sem foto de capa
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  Adicione fotos para melhorar a consulta comercial e operacional.
                </p>
              </div>
            </div>
          )}
        </div>

        <SectionCard
          title="Status operacional"
          description="Leitura rápida para atendimento, balcão e gestão."
        >
          <div className="space-y-3">
            {statusCards.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-ink-200 bg-[var(--elevated-bg)] px-4 py-4"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
                  {item.label}
                </p>
                <div className="mt-2">
                  <StatusBadge label={item.value} tone={item.tone} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="panel-card">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {property360Sections.map((section) => {
            const Icon = section.icon;
            const selected = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 ${
                  selected
                    ? "bg-ink-950 text-white shadow-[0_16px_30px_-24px_rgba(24,57,48,0.72)]"
                    : "bg-[var(--elevated-bg)] text-ink-600 hover:text-ink-950"
                }`}
              >
                <Icon size={16} />
                {section.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Contratos", value: property.metrics.contractCount },
          { label: "Visitas", value: property.metrics.visitCount },
          { label: "Chaves", value: property.metrics.keyCount },
          { label: "Chamados", value: property.metrics.maintenanceTicketCount },
          {
            label: "Leads",
            value: property.metrics.saleLeadCount + property.metrics.rentLeadCount,
          },
        ].map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-4xl text-ink-950">{item.value}</p>
          </SectionCard>
        ))}
      </section>

      {activeSection === "resumo" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <SectionCard
            title="Resumo do imóvel"
            description="Dados essenciais para consulta rápida e tomada de decisão."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  label: "Finalidade",
                  value: getOptionLabel(propertyPurposeOptions, property.purpose),
                },
                {
                  label: "Tipo",
                  value: getOptionLabel(propertyTypeOptions, property.type),
                },
                { label: "Venda", value: formatCurrency(property.salePrice) },
                { label: "Locação", value: formatCurrency(property.rentPrice) },
                { label: "Condomínio", value: formatCurrency(property.condoFee) },
                { label: "IPTU", value: formatCurrency(property.iptu) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700 dark:bg-ink-100/10"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
                    {item.label}
                  </p>
                  <p className="mt-2 font-semibold text-ink-900">{item.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="space-y-5">
            <SectionCard title="Proprietário">
              <div className="space-y-3">
                <p className="font-display text-2xl text-ink-950">
                  {property.owner.fullName}
                </p>
                <p className="text-sm text-ink-500">{property.owner.document}</p>
                <p className="text-sm text-ink-600">
                  {getContactLine(property.owner)}
                </p>
              </div>
            </SectionCard>

            <SectionCard title="Locatário atual">
              {property.activeTenant ? (
                <div className="space-y-3">
                  <p className="font-display text-2xl text-ink-950">
                    {property.activeTenant.fullName}
                  </p>
                  <p className="text-sm text-ink-500">
                    {property.activeTenant.document}
                  </p>
                  <p className="text-sm text-ink-600">
                    {getContactLine(property.activeTenant)}
                  </p>
                </div>
              ) : (
                <EmptyState
                  title="Sem locatário ativo"
                  description="O imóvel não possui contrato ativo vinculado a um locatário no momento."
                />
              )}
            </SectionCard>
          </div>
        </div>
      ) : null}

      {activeSection === "fotos" ? (
        <PropertyImagesPanel
          accessToken={accessToken!}
          propertyId={property.id}
          propertyTitle={property.title}
          images={property.propertyImages}
          canManage={canManageImages}
        />
      ) : null}

      {activeSection === "operacao" ? (
        <div className="space-y-5">
          <SectionCard
            title="Ações rápidas"
            description="Atalhos para a rotina de balcão e operação do imóvel."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                canWriteVisits
                  ? {
                      label: "Registrar visita",
                      href: appRoutes.visits,
                      icon: CalendarClock,
                    }
                  : null,
                canReadKeys
                  ? {
                      label: canWriteKeys ? "Retirar ou devolver chave" : "Ver chaves",
                      href: appRoutes.keys,
                      icon: KeyRound,
                    }
                  : null,
                canWriteMaintenance
                  ? {
                      label: "Abrir chamado",
                      href: appRoutes.maintenanceTicketNew,
                      icon: Wrench,
                    }
                  : null,
                canGenerateContracts
                  ? {
                      label: "Gerar contrato",
                      href: appRoutes.contractGenerator,
                      icon: PlusCircle,
                    }
                  : null,
              ]
                .filter(Boolean)
                .map((action) => {
                  const Icon = action!.icon;

                  return (
                    <Link
                      key={action!.label}
                      to={action!.href}
                      className="secondary-button justify-start"
                    >
                      <Icon size={18} />
                      {action!.label}
                    </Link>
                  );
                })}
            </div>
          </SectionCard>

          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard title="Chaves cadastradas">
              {property.propertyKeys.length ? (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Identificador</th>
                        <th>Status</th>
                        <th>Responsável atual</th>
                        <th>Última retirada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.propertyKeys.map((item) => (
                        <tr key={item.id}>
                          <td className="font-semibold text-ink-900">
                            {item.identifier}
                          </td>
                          <td>
                            <StatusBadge
                              label={getOptionLabel(keyStatusOptions, item.currentStatus)}
                              tone={resolveStatusTone(item.currentStatus)}
                            />
                          </td>
                          <td className="text-sm text-ink-600">
                            {item.currentHolderName ?? "Disponível internamente"}
                          </td>
                          <td className="text-sm text-ink-600">
                            {formatDateTime(item.lastCheckoutAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="Sem chave cadastrada"
                  description="Cadastre uma chave para controlar retiradas e devoluções."
                />
              )}
            </SectionCard>

            <SectionCard title="Visitas recentes">
              <div className="space-y-3">
                {property.visits.length ? (
                  property.visits.map((visit) => (
                    <div
                      key={visit.id}
                      className="rounded-2xl border border-ink-200 px-4 py-4"
                    >
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
                          label={getOptionLabel(visitStatusOptions, visit.status)}
                          tone={resolveStatusTone(visit.status)}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="Nenhuma visita recente"
                    description="As visitas vinculadas a este imóvel aparecerão aqui."
                  />
                )}
              </div>
            </SectionCard>
          </div>

          {canReadMaintenance ? (
            <SectionCard title="Chamados de manutenção">
              {property.maintenanceTickets.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {property.maintenanceTickets.map((ticket) => (
                    <article
                      key={ticket.id}
                      className="rounded-[24px] border border-ink-200 bg-[var(--elevated-bg)] px-4 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-brand-600">
                            {ticket.ticketId}
                          </p>
                          <h3 className="mt-2 font-semibold text-ink-950">
                            {ticket.title}
                          </h3>
                          <p className="mt-1 text-sm text-ink-500">
                            {getOptionLabel(maintenanceTicketTypeOptions, ticket.type)}
                          </p>
                        </div>
                        <StatusBadge
                          label={`Urgência ${ticket.urgencyLevel}`}
                          tone={getUrgencyTone(ticket.urgencyLevel)}
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <StatusBadge
                          label={getOptionLabel(
                            maintenanceTicketStatusOptions,
                            ticket.status,
                          )}
                          tone={resolveStatusTone(ticket.status)}
                        />
                        <span className="rounded-full bg-ink-50 px-3 py-1 text-xs text-ink-500 dark:bg-ink-100/10">
                          {ticket.assignedToUser?.fullName ?? "Sem responsável"}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Nenhum chamado vinculado"
                  description="Chamados de manutenção do imóvel aparecerão aqui."
                />
              )}
            </SectionCard>
          ) : null}
        </div>
      ) : null}

      {activeSection === "contratos" ? (
        <SectionCard title="Contratos relacionados">
          <div className="space-y-3">
            {property.contracts.length ? (
              property.contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="rounded-2xl border border-ink-200 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink-900">{contract.code}</p>
                      <p className="mt-1 text-sm text-ink-500">
                        {contract.tenant.fullName} · {formatCurrency(contract.rentAmount)}
                      </p>
                      <p className="mt-1 text-xs text-ink-400">
                        {formatDate(contract.startDate)} até {formatDate(contract.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        label={getOptionLabel(contractStatusOptions, contract.status)}
                        tone={resolveStatusTone(contract.status)}
                      />
                      {canReadContracts ? (
                        <Link
                          to={buildDetailPath(appRoutes.contractDetail, contract.id)}
                          className="secondary-button px-3 py-2 text-xs"
                        >
                          Abrir
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Nenhum contrato vinculado"
                description="Quando houver contratos ligados a este imóvel, eles aparecerão aqui."
              />
            )}
          </div>
        </SectionCard>
      ) : null}

      {activeSection === "historico" ? (
        <SectionCard
          title="Histórico resumido"
          description="Últimos movimentos relevantes do imóvel em contratos, chaves, visitas e manutenção."
        >
          {recentHistory.length ? (
            <div className="space-y-3">
              {recentHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-2xl border border-ink-200 bg-[var(--elevated-bg)] px-4 py-4"
                >
                  <div className="mt-1 grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-100/20 dark:text-brand-800">
                    <History size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-ink-950">{item.title}</p>
                      <span className="text-xs text-ink-400">
                        {formatDateTime(item.date)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-500">{item.description}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                      {item.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Histórico ainda vazio"
              description="Movimentações do imóvel aparecerão aqui conforme a operação avançar."
            />
          )}
        </SectionCard>
      ) : null}

      {activeSection === "cadastro" ? (
        <SectionCard title="Características e observações">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700 dark:bg-ink-100/10">
              Dormitórios: {property.bedrooms ?? "Não informado"}
            </div>
            <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700 dark:bg-ink-100/10">
              Banheiros: {property.bathrooms ?? "Não informado"}
            </div>
            <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700 dark:bg-ink-100/10">
              Suítes: {property.suites ?? "Não informado"}
            </div>
            <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700 dark:bg-ink-100/10">
              Vagas: {property.parkingSpots ?? "Não informado"}
            </div>
            <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700 dark:bg-ink-100/10">
              Área total: {property.areaTotal ?? "Não informado"} m²
            </div>
            <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700 dark:bg-ink-100/10">
              Área construída: {property.areaBuilt ?? "Não informado"} m²
            </div>
            <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700 dark:bg-ink-100/10">
              Mobiliado: {property.furnished ? "Sim" : "Não"}
            </div>
            <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700 dark:bg-ink-100/10">
              Aceita pet: {property.acceptsPet ? "Sim" : "Não informado"}
            </div>
            <div className="rounded-2xl bg-ink-50 px-4 py-4 text-sm text-ink-700 dark:bg-ink-100/10">
              Publicado: {property.isPublished ? "Sim" : "Não"}
            </div>
          </div>
          {property.description ? (
            <p className="mt-5 text-sm text-ink-700">{property.description}</p>
          ) : null}
          {property.internalNotes ? (
            <div className="mt-4 rounded-2xl bg-sand-50 px-4 py-4 text-sm text-ink-700 dark:bg-sand-100/10">
              {property.internalNotes}
            </div>
          ) : null}
        </SectionCard>
      ) : null}

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
