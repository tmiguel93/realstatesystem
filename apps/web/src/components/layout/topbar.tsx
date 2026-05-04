import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  Globe2,
  LogOut,
  MoonStar,
  Search,
  SunMedium,
} from "lucide-react";
import { appRoutes, roleLabels } from "@imobiliaria/shared";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-context";
import { useI18n } from "@/features/preferences/language-provider";
import { useTheme } from "@/features/preferences/theme-provider";
import { buildDetailPath, formatDateTime } from "@/lib/format";
import { notificationsService } from "@/services/notifications-service";

export function Topbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken, user, logout, updatePreferences } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const { themePreference, resolvedTheme, setThemePreference } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsService.list(accessToken!, 8),
    enabled: Boolean(accessToken),
    refetchInterval: 60_000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.markAsRead(accessToken!, notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  const openNotification = async (notification: {
    id: string;
    entityType: string | null;
    entityId: string | null;
  }) => {
    await markAsReadMutation.mutateAsync(notification.id);

    if (
      notification.entityType === "MAINTENANCE_TICKET" &&
      notification.entityId
    ) {
      navigate(buildDetailPath(appRoutes.maintenanceTicketDetail, notification.entityId));
      setNotificationsOpen(false);
    }
  };

  const persistPreferences = async (payload: {
    preferredTheme: "SYSTEM" | "LIGHT" | "DARK";
    preferredLocale: "PT_BR" | "EN" | "ES";
  }) => {
    try {
      await updatePreferences(payload);
      toast.success(t("common.preferencesSaved"));
    } catch {
      toast.error(t("common.preferencesError"));
    }
  };

  const nextThemePreference =
    themePreference === "SYSTEM"
      ? "LIGHT"
      : themePreference === "LIGHT"
        ? "DARK"
        : "SYSTEM";

  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-[var(--panel-bg)] px-5 py-4 shadow-soft backdrop-blur-xl"
    >
      <div className="flex min-w-[280px] flex-1 items-center gap-3 rounded-[22px] border border-ink-200/80 bg-[var(--field-bg)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Search size={17} />
        </span>
        <input
          className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
          placeholder={t("common.searchPlaceholder")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-[22px] border border-ink-200/80 bg-[var(--elevated-bg)] px-3 py-2">
          <button
            type="button"
            onClick={() => {
              setThemePreference(nextThemePreference);
              void persistPreferences({
                preferredTheme: nextThemePreference,
                preferredLocale: locale,
              });
            }}
            className="grid size-10 place-items-center rounded-2xl text-ink-600 transition hover:bg-brand-50 hover:text-brand-700"
            title={t("layout.themeToggleTitle")}
          >
            {resolvedTheme === "dark" ? <SunMedium size={18} /> : <MoonStar size={18} />}
          </button>

          <div className="flex items-center gap-2 rounded-2xl bg-brand-50/70 px-3 py-2 text-sm font-medium text-brand-700">
            <Globe2 size={16} />
            <select
              value={locale}
              onChange={(event) => {
                const nextLocale = event.target.value as "PT_BR" | "EN" | "ES";
                setLocale(nextLocale);
                void persistPreferences({
                  preferredTheme: themePreference,
                  preferredLocale: nextLocale,
                });
              }}
              className="bg-transparent pr-1 outline-none"
            >
              <option value="PT_BR">PT-BR</option>
              <option value="EN">EN</option>
              <option value="ES">ES</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setNotificationsOpen((current) => !current)}
            className="relative grid size-11 place-items-center rounded-2xl border border-ink-200/80 bg-[var(--elevated-bg)] text-ink-600 transition duration-200 hover:-translate-y-px hover:border-brand-200 hover:text-brand-700"
          >
            <Bell size={18} />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-[22px] items-center justify-center rounded-full bg-rose-600 px-1.5 py-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>

          <AnimatePresence>
            {notificationsOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 z-30 mt-3 w-[380px] rounded-[28px] border border-white/10 bg-[var(--panel-bg)] p-4 shadow-[0_28px_54px_-28px_rgba(0,0,0,0.34)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl text-ink-950">
                      {t("layout.notificationsTitle")}
                    </p>
                    <p className="mt-1 text-sm text-ink-500">
                      {t("layout.notificationsDescription")}
                    </p>
                  </div>
                  <span className="rounded-full border border-ink-200 bg-[var(--elevated-bg)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
                    {t("layout.alertsCount", { count: unreadCount })}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {notificationsQuery.data?.items.length ? (
                    notificationsQuery.data.items.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => void openNotification(notification)}
                        className="w-full rounded-[24px] border border-ink-200 bg-[var(--elevated-bg)] px-4 py-4 text-left transition hover:border-brand-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-ink-950">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-ink-500">
                              {notification.message}
                            </p>
                          </div>
                          {notification.readAt ? null : (
                            <span className="mt-1 size-2 rounded-full bg-rose-500" />
                          )}
                        </div>
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ink-400">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">
                      {t("layout.notificationsEmpty")}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 rounded-[24px] border border-ink-200/80 bg-[var(--elevated-bg)] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-sand-300 to-brand-500 font-display text-sm text-white shadow-[0_14px_30px_-20px_rgba(34,109,87,0.58)]">
            {user?.fullName
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("")}
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-ink-900">{user?.fullName}</p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink-400">
              {user?.roles
                .map((role) => roleLabels[role as keyof typeof roleLabels] ?? role)
                .join(" / ")}
            </p>
          </div>

          <ChevronDown size={16} className="hidden text-ink-300 sm:block" />

          <button
            onClick={() => void logout()}
            className="grid size-10 place-items-center rounded-xl text-ink-500 transition duration-200 hover:bg-ink-50 hover:text-ink-900"
            title={t("common.logout")}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
