import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  appRoutes,
  contactRoleOptions,
  permissionCodes,
} from "@imobiliaria/shared";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PaginationControls } from "@/components/navigation/pagination-controls";
import { ContactFormDrawer } from "@/features/contacts/contact-form-drawer";
import { useAuth } from "@/features/auth/auth-context";
import { buildDetailPath } from "@/lib/format";
import { contactsService } from "@/services/contacts-service";
import type { ContactListItem, ContactRole } from "@/types/domain";

const roleToneMap: Record<
  ContactRole,
  "success" | "warning" | "danger" | "neutral" | "brand"
> = {
  OWNER: "brand",
  TENANT: "success",
  BUYER: "warning",
  GUARANTOR: "neutral",
  EXTERNAL_BROKER: "danger",
};

function roleLabel(role: ContactRole) {
  return (
    contactRoleOptions.find((option) => option.value === role)?.label ?? role
  );
}

function relationshipPath(contact: ContactListItem) {
  if (contact.ownerId) {
    return buildDetailPath(appRoutes.ownerDetail, contact.ownerId);
  }

  if (contact.tenantId) {
    return buildDetailPath(appRoutes.tenantDetail, contact.tenantId);
  }

  return null;
}

function contactLocation(contact: ContactListItem) {
  if (!contact.city && !contact.state) {
    return "Não informado";
  }

  return `${contact.city ?? "Não informado"} / ${contact.state ?? "--"}`;
}

export function ContactsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken, hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedContact, setSelectedContact] =
    useState<ContactListItem | null>(null);

  const deferredSearch = useDeferredValue(search);
  const canWriteContacts = hasPermission(permissionCodes.CONTACTS_WRITE);

  const contactsQuery = useQuery({
    queryKey: ["contacts", page, deferredSearch, roleFilter, statusFilter],
    queryFn: () =>
      contactsService.list({
        accessToken: accessToken!,
        page,
        pageSize: 10,
        search: deferredSearch || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter || undefined,
      }),
    enabled: Boolean(accessToken),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof contactsService.create>[1]) =>
      contactsService.create(accessToken!, payload),
    onSuccess: async () => {
      toast.success("Contato cadastrado com sucesso.");
      setDrawerOpen(false);
      setSelectedContact(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["contacts"] }),
        queryClient.invalidateQueries({ queryKey: ["owners"] }),
        queryClient.invalidateQueries({ queryKey: ["tenants"] }),
      ]);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o contato.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof contactsService.update>[2]) =>
      contactsService.update(accessToken!, selectedContact!.id, payload),
    onSuccess: async () => {
      toast.success("Contato atualizado com sucesso.");
      setDrawerOpen(false);
      setSelectedContact(null);
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o contato.",
      );
    },
  });

  const summary = contactsQuery.data?.summary;
  const metrics = useMemo(
    () => [
      { label: "Total filtrado", value: summary?.total ?? 0 },
      { label: "Proprietários", value: summary?.owners ?? 0 },
      { label: "Locatários", value: summary?.tenants ?? 0 },
      { label: "Compradores", value: summary?.buyers ?? 0 },
      { label: "Fiadores", value: summary?.guarantors ?? 0 },
    ],
    [summary],
  );

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cadastro único"
        title="Contatos unificados"
        description="Encontre pessoas por nome, CPF/CNPJ, telefone, e-mail ou papel e reduza cadastros duplicados na operação."
        actions={
          canWriteContacts ? (
            <button
              type="button"
              onClick={() => {
                setSelectedContact(null);
                setDrawerOpen(true);
              }}
              className="secondary-button"
            >
              Novo contato
            </button>
          ) : null
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-4xl text-ink-950">
              {item.value}
            </p>
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Base operacional"
        description="Comece pela busca: se a pessoa já existir como proprietário ou locatário, ela aparece aqui como cadastro legado reaproveitado."
        actions={
          <Link to={appRoutes.owners} className="secondary-button">
            Ver proprietários
          </Link>
        }
      >
        <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome, CPF/CNPJ, telefone ou e-mail"
            className="filter-control"
          />
          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
            className="filter-control"
          >
            <option value="">Todos os papéis</option>
            {contactRoleOptions.map((option) => (
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
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>

        <div className="mb-5 rounded-[26px] border border-brand-100 bg-brand-50/70 p-4 text-sm text-brand-800">
          <p className="font-semibold">Regra anti-duplicidade ativa</p>
          <p className="mt-1 text-brand-700">
            Novos contatos são bloqueados quando CPF/CNPJ, e-mail ou telefone
            já existem na base unificada, em proprietários ou em locatários.
          </p>
        </div>

        {contactsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="skeleton-shimmer h-20 rounded-[22px] border border-ink-100 bg-white/78"
              />
            ))}
          </div>
        ) : contactsQuery.data?.data.length ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contato</th>
                    <th>Documento</th>
                    <th>Papéis</th>
                    <th>Localização</th>
                    <th>Vínculos</th>
                    <th>Status</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contactsQuery.data.data.map((contact) => {
                    const path = relationshipPath(contact);

                    return (
                      <tr key={contact.id}>
                        <td>
                          <p className="font-semibold text-ink-900">
                            {contact.fullName}
                          </p>
                          <p className="text-sm text-ink-500">
                            {contact.email ?? "Sem e-mail"} ·{" "}
                            {contact.phone ?? "Sem telefone"}
                          </p>
                          {contact.sourceType === "LEGACY" ? (
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-sand-600">
                              Cadastro legado reaproveitado
                            </p>
                          ) : null}
                        </td>
                        <td className="text-sm text-ink-600">
                          {contact.document ?? "Não informado"}
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            {contact.roles.map((role) => (
                              <StatusBadge
                                key={role}
                                label={roleLabel(role)}
                                tone={roleToneMap[role]}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="text-sm text-ink-600">
                          {contactLocation(contact)}
                        </td>
                        <td className="text-sm text-ink-600">
                          {contact.propertyCount} imóvel(is) ·{" "}
                          {contact.contractCount} contrato(s)
                        </td>
                        <td>
                          <StatusBadge
                            label={contact.isActive ? "Ativo" : "Inativo"}
                            tone={contact.isActive ? "success" : "neutral"}
                          />
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            {path ? (
                              <button
                                type="button"
                                onClick={() => navigate(path)}
                                className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-200 hover:text-ink-950"
                              >
                                Abrir vínculo
                              </button>
                            ) : null}
                            {canWriteContacts &&
                            contact.sourceType === "CONTACT" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedContact(contact);
                                  setDrawerOpen(true);
                                }}
                                className="rounded-2xl bg-ink-950 px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-px"
                              >
                                Editar
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationControls
              page={contactsQuery.data.meta.page}
              totalPages={contactsQuery.data.meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : (
          <EmptyState
            title="Nenhum contato encontrado"
            description="Use a busca para conferir duplicidades. Se a pessoa realmente não existir, cadastre um contato com os papéis corretos."
            action={
              canWriteContacts ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContact(null);
                    setDrawerOpen(true);
                  }}
                  className="primary-button"
                >
                  Cadastrar contato
                </button>
              ) : null
            }
          />
        )}
      </SectionCard>

      <ContactFormDrawer
        open={drawerOpen}
        initialData={selectedContact}
        pending={pending}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedContact(null);
        }}
        onSubmit={async (values) => {
          if (selectedContact) {
            await updateMutation.mutateAsync(values);
            return;
          }

          await createMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
