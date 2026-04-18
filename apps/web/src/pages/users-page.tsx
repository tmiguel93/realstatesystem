import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  permissionLabels,
  roleLabels,
  userStatusOptions,
} from "@imobiliaria/shared";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PaginationControls } from "@/components/navigation/pagination-controls";
import { useAuth } from "@/features/auth/auth-context";
import { ResetPasswordDrawer } from "@/features/users/reset-password-drawer";
import { UserFormDrawer } from "@/features/users/user-form-drawer";
import { formatDateTime } from "@/lib/format";
import { resolveStatusTone } from "@/lib/status";
import { tenantsService } from "@/services/tenants-service";
import { usersService } from "@/services/users-service";
import type { UserDetail, UserListItem } from "@/types/domain";

function resolveRoleLabel(roleCode: string) {
  return roleLabels[roleCode as keyof typeof roleLabels] ?? roleCode;
}

function resolvePermissionLabel(permissionCode: string) {
  return (
    permissionLabels[permissionCode as keyof typeof permissionLabels] ??
    permissionCode
  );
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [resetTarget, setResetTarget] = useState<UserListItem | null>(null);

  const deferredSearch = useDeferredValue(search);

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: () => usersService.listRoles(accessToken!),
    enabled: Boolean(accessToken),
  });

  const tenantsQuery = useQuery({
    queryKey: ["tenant-options"],
    queryFn: () =>
      tenantsService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(accessToken),
  });

  const usersQuery = useQuery({
    queryKey: ["users", page, deferredSearch, statusFilter, roleFilter],
    queryFn: () =>
      usersService.list({
        accessToken: accessToken!,
        page,
        pageSize: 10,
        search: deferredSearch || undefined,
        status: statusFilter || undefined,
        roleCode: roleFilter || undefined,
      }),
    enabled: Boolean(accessToken),
  });

  const selectedUserQuery = useQuery({
    queryKey: ["user-detail", selectedUserId],
    queryFn: () => usersService.getById(accessToken!, selectedUserId!),
    enabled: Boolean(accessToken && selectedUserId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof usersService.create>[1]) =>
      usersService.create(accessToken!, payload),
    onSuccess: async (result: UserListItem) => {
      toast.success("Usuário cadastrado com sucesso.");
      setFormOpen(false);
      setEditingUser(null);
      setSelectedUserId(result.id);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["user-detail", result.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof usersService.update>[2]) =>
      usersService.update(accessToken!, editingUser!.id, payload),
    onSuccess: async (result: UserListItem) => {
      toast.success("Usuário atualizado com sucesso.");
      setFormOpen(false);
      setEditingUser(null);
      setSelectedUserId(result.id);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["user-detail", result.id] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      usersService.updateStatus(accessToken!, userId, status),
    onSuccess: async (result: UserListItem) => {
      toast.success("Status do usuário atualizado.");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["user-detail", result.id] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: Parameters<typeof usersService.resetPassword>[2]) =>
      usersService.resetPassword(accessToken!, resetTarget!.id, payload),
    onSuccess: async () => {
      toast.success("Senha redefinida com sucesso.");
      setResetOpen(false);
      setResetTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      if (selectedUserId) {
        await queryClient.invalidateQueries({ queryKey: ["user-detail", selectedUserId] });
      }
    },
  });

  const metrics = useMemo(() => {
    const users = usersQuery.data?.data ?? [];
    return {
      active: users.filter((item) => item.status === "ACTIVE").length,
      lockedOrInactive: users.filter((item) =>
        ["INACTIVE", "LOCKED"].includes(item.status),
      ).length,
      admins: users.filter((item) => item.roleCodes.includes("MASTER_ADMIN")).length,
    };
  }, [usersQuery.data]);

  const selectedUser = selectedUserQuery.data;
  const roles = rolesQuery.data ?? [];
  const userForDrawer =
    editingUser && selectedUser?.id === editingUser.id ? selectedUser : editingUser;
  const pending = createMutation.isPending || updateMutation.isPending;
  const tenantOptions = (tenantsQuery.data?.data ?? []).map((tenant) => ({
    value: tenant.id,
    label: tenant.fullName,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governança de acesso"
        title="Usuários"
        description="Administre perfis, status operacionais, troca obrigatória de senha, portal do locatário e trilha recente de auditoria."
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingUser(null);
              setFormOpen(true);
            }}
            className="secondary-button"
          >
            Novo usuário
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Usuários ativos", value: metrics.active },
          { label: "Bloqueados ou inativos", value: metrics.lockedOrInactive },
          { label: "Administradores", value: metrics.admins },
        ].map((item) => (
          <SectionCard key={item.label}>
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-2 font-display text-4xl text-ink-950">{item.value}</p>
          </SectionCard>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
        <SectionCard
          title="Equipe cadastrada"
          description="Filtre por status, perfil e contexto operacional para manter o controle administrativo."
        >
          <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_200px_220px]">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nome, e-mail ou telefone"
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
              {userStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
              className="filter-control"
            >
              <option value="">Todos os perfis</option>
              {roles.map((role) => (
                <option key={role.code} value={role.code}>
                  {resolveRoleLabel(role.code)}
                </option>
              ))}
            </select>
          </div>

          {usersQuery.data?.data.length ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Usuário</th>
                      <th>Perfis</th>
                      <th>Status</th>
                      <th>Último acesso</th>
                      <th>Segurança</th>
                      <th className="text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersQuery.data.data.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <p className="font-semibold text-ink-900">{user.fullName}</p>
                          <p className="text-sm text-ink-500">{user.email}</p>
                        </td>
                        <td className="text-sm text-ink-600">
                          {user.roleCodes.map(resolveRoleLabel).join(", ")}
                        </td>
                        <td>
                          <StatusBadge
                            label={user.status}
                            tone={resolveStatusTone(user.status)}
                          />
                        </td>
                        <td className="text-sm text-ink-600">
                          {formatDateTime(user.lastLoginAt)}
                        </td>
                        <td className="text-sm text-ink-600">
                          {user.permissionCount} permissões
                          <br />
                          {user.mustChangePassword
                            ? "Troca obrigatória pendente"
                            : "Troca livre"}
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedUserId(user.id)}
                              className="secondary-button px-3 py-2"
                            >
                              Detalhes
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUser(user);
                                setFormOpen(true);
                              }}
                              className="primary-button px-3 py-2"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetTarget(user);
                                setResetOpen(true);
                              }}
                              className="secondary-button px-3 py-2"
                            >
                              Senha
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                page={usersQuery.data.meta.page}
                totalPages={usersQuery.data.meta.totalPages}
                onPageChange={setPage}
              />
            </div>
          ) : (
            <EmptyState
              title="Nenhum usuário encontrado"
              description="Cadastre contas internas para organizar o acesso por perfil e rastrear a operação."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setFormOpen(true);
                  }}
                  className="primary-button"
                >
                  Cadastrar usuário
                </button>
              }
            />
          )}
        </SectionCard>

        <SectionCard
          title="Painel do usuário"
          description="Selecione uma conta para revisar papéis, permissões herdadas e atividade recente."
          actions={
            selectedUser ? (
              <button
                type="button"
                onClick={() =>
                  statusMutation.mutate({
                    userId: selectedUser.id,
                    status: selectedUser.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                  })
                }
                disabled={statusMutation.isPending}
                className="secondary-button"
              >
                {selectedUser.status === "ACTIVE" ? "Inativar" : "Ativar"}
              </button>
            ) : null
          }
        >
          {selectedUser ? (
            <div className="space-y-5">
              <div className="rounded-3xl bg-ink-50 px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-3xl text-ink-950">
                      {selectedUser.fullName}
                    </p>
                    <p className="mt-1 text-sm text-ink-500">{selectedUser.email}</p>
                    <p className="mt-2 text-sm text-ink-600">
                      Último acesso: {formatDateTime(selectedUser.lastLoginAt)}
                    </p>
                  </div>
                  <StatusBadge
                    label={selectedUser.status}
                    tone={resolveStatusTone(selectedUser.status)}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
                  Perfis ativos
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedUser.roleCodes.map((roleCode) => (
                    <StatusBadge
                      key={roleCode}
                      label={resolveRoleLabel(roleCode)}
                      tone="brand"
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
                  Preferências
                </p>
                <div className="mt-3 rounded-[24px] border border-ink-200 bg-[var(--elevated-bg)] px-4 py-4 text-sm text-ink-600">
                  Tema preferido: {selectedUser.preferredTheme}
                  <br />
                  Idioma preferido: {selectedUser.preferredLocale}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
                  Permissões herdadas
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedUser.permissions.map((permissionCode) => (
                    <span
                      key={permissionCode}
                      className="rounded-full border border-ink-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-600"
                    >
                      {resolvePermissionLabel(permissionCode)}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
                  Auditoria recente
                </p>
                <div className="mt-3 space-y-3">
                  {selectedUser.auditLogs.length ? (
                    selectedUser.auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-2xl border border-ink-200 bg-white px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-ink-900">
                              {log.description}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-400">
                              {log.action}
                            </p>
                          </div>
                          <p className="text-xs text-ink-500">
                            {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-ink-200 bg-white px-4 py-4 text-sm text-ink-500">
                      Nenhum evento recente para este usuário.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Selecione um usuário"
              description="Abra os detalhes de uma conta para revisar papéis, segurança e histórico recente."
            />
          )}
        </SectionCard>
      </div>

      <UserFormDrawer
        open={formOpen}
        roles={roles}
        tenantOptions={tenantOptions}
        initialData={userForDrawer as UserDetail | UserListItem | null}
        pending={pending}
        onClose={() => {
          setFormOpen(false);
          setEditingUser(null);
        }}
        onSubmit={async (values) => {
          if (editingUser) {
            await updateMutation.mutateAsync(values);
            return;
          }

          await createMutation.mutateAsync(values);
        }}
      />

      <ResetPasswordDrawer
        open={resetOpen}
        pending={resetPasswordMutation.isPending}
        userName={resetTarget?.fullName}
        onClose={() => {
          setResetOpen(false);
          setResetTarget(null);
        }}
        onSubmit={async (values) => {
          await resetPasswordMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
