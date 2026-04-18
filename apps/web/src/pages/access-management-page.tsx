import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { permissionLabels, roleLabels } from "@imobiliaria/shared";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { useAuth } from "@/features/auth/auth-context";
import { useI18n } from "@/features/preferences/language-provider";
import { usersService } from "@/services/users-service";
import type { PermissionItem } from "@/types/domain";

export function AccessManagementPage() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);

  const rolesQuery = useQuery({
    queryKey: ["access-roles"],
    queryFn: () => usersService.listRoles(accessToken!),
    enabled: Boolean(accessToken),
  });

  const permissionsQuery = useQuery({
    queryKey: ["access-permissions"],
    queryFn: () => usersService.listPermissions(accessToken!),
    enabled: Boolean(accessToken),
  });

  const selectedRole = useMemo(
    () => rolesQuery.data?.find((role) => role.id === selectedRoleId) ?? null,
    [rolesQuery.data, selectedRoleId],
  );

  useEffect(() => {
    const firstRole = rolesQuery.data?.[0];

    if (!selectedRoleId && firstRole) {
      setSelectedRoleId(firstRole.id);
      setDraftPermissions(firstRole.permissionCodes);
    }
  }, [rolesQuery.data, selectedRoleId]);

  useEffect(() => {
    if (selectedRole) {
      setDraftPermissions(selectedRole.permissionCodes);
    }
  }, [selectedRole]);

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, PermissionItem[]>();

    (permissionsQuery.data ?? []).forEach((permission) => {
      const items = groups.get(permission.resource) ?? [];
      items.push(permission);
      groups.set(permission.resource, items);
    });

    return Array.from(groups.entries());
  }, [permissionsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (permissionCodes: string[]) =>
      usersService.updateRolePermissions(
        accessToken!,
        selectedRoleId,
        permissionCodes,
      ),
    onSuccess: async () => {
      toast.success(t("accessManagement.updated"));
      await queryClient.invalidateQueries({ queryKey: ["access-roles"] });
    },
  });

  const togglePermission = (permissionCode: string) => {
    setDraftPermissions((current) =>
      current.includes(permissionCode)
        ? current.filter((item) => item !== permissionCode)
        : [...current, permissionCode],
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="RBAC"
        title={t("accessManagement.title")}
        description={t("accessManagement.description")}
        actions={
          selectedRole ? (
            <button
              type="button"
              onClick={() => saveMutation.mutate(draftPermissions)}
              disabled={saveMutation.isPending}
              className="secondary-button"
            >
              {saveMutation.isPending
                ? `${t("common.loading")}...`
                : t("accessManagement.saveRole")}
            </button>
          ) : null
        }
      />

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard
          title={t("accessManagement.roles")}
          description={t("accessManagement.rolesDescription")}
        >
          <div className="space-y-3">
            {(rolesQuery.data ?? []).map((role) => {
              const selected = role.id === selectedRoleId;
              const roleLabel =
                roleLabels[role.code as keyof typeof roleLabels] ?? role.name;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full rounded-[24px] border px-5 py-5 text-left transition ${
                    selected
                      ? "border-brand-300 bg-brand-50"
                      : "border-ink-200 bg-[var(--elevated-bg)]"
                  }`}
                >
                  <p className="font-semibold text-ink-950">{roleLabel}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    {t("accessManagement.inheritedPermissions", {
                      count: role.permissionCodes.length,
                    })}
                  </p>
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title={t("accessManagement.permissions")}
          description={
            selectedRole
              ? `Ajuste a matriz do perfil ${
                  roleLabels[selectedRole.code as keyof typeof roleLabels] ??
                  selectedRole.name
                }.`
              : t("accessManagement.editHint")
          }
        >
          {selectedRole ? (
            <div className="space-y-5">
              {groupedPermissions.map(([resource, permissions]) => (
                <div key={resource} className="rounded-[24px] border border-ink-200 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-400">
                    {resource}
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {permissions.map((permission) => {
                      const checked = draftPermissions.includes(permission.code);
                      const permissionLabel =
                        permissionLabels[
                          permission.code as keyof typeof permissionLabels
                        ] ?? permission.code;

                      return (
                        <button
                          key={permission.id}
                          type="button"
                          onClick={() => togglePermission(permission.code)}
                          className={`rounded-[22px] border px-4 py-4 text-left transition ${
                            checked
                              ? "border-brand-300 bg-brand-50"
                              : "border-ink-200 bg-[var(--elevated-bg)]"
                          }`}
                        >
                          <p className="font-semibold text-ink-950">
                            {permissionLabel}
                          </p>
                          <p className="mt-1 text-sm text-ink-500">
                            {t("accessManagement.permissionMeta", {
                              action: permission.action,
                              code: permission.code,
                            })}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("accessManagement.noSelectionTitle")}
              description={t("accessManagement.noSelectionDescription")}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
