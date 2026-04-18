import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, LogOut, Search } from "lucide-react";
import { appRoutes } from "@imobiliaria/shared";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { buildDetailPath, formatDateTime } from "@/lib/format";
import { notificationsService } from "@/services/notifications-service";

export function Topbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken, user, logout } = useAuth();
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

  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/75 bg-white/72 px-5 py-4 shadow-[0_18px_40px_-28px_rgba(24,57,48,0.18)] backdrop-blur-xl"
    >
      <div className="flex min-w-[280px] flex-1 items-center gap-3 rounded-[22px] border border-ink-200/80 bg-[#fcfbf8] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Search size={17} />
        </span>
        <input
          className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
          placeholder="Buscar imovel, lead, visita, contrato ou cliente"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen((current) => !current)}
            className="relative grid size-11 place-items-center rounded-2xl border border-ink-200/80 bg-white/92 text-ink-600 transition duration-200 hover:-translate-y-px hover:border-brand-200 hover:text-brand-700"
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
                className="absolute right-0 z-30 mt-3 w-[380px] rounded-[28px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,245,239,0.95))] p-4 shadow-[0_28px_54px_-28px_rgba(24,57,48,0.3)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl text-ink-950">Alertas</p>
                    <p className="mt-1 text-sm text-ink-500">
                      Chamados vencidos no SLA e itens que seguem em aberto.
                    </p>
                  </div>
                  <span className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
                    {unreadCount} nao lida(s)
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {notificationsQuery.data?.items.length ? (
                    notificationsQuery.data.items.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => void openNotification(notification)}
                        className="w-full rounded-[24px] border border-ink-200 bg-white px-4 py-4 text-left transition hover:border-brand-200"
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
                      Nenhuma notificacao operacional no momento.
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 rounded-[24px] border border-ink-200/80 bg-white/92 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
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
              {user?.roles.join(" / ")}
            </p>
          </div>

          <ChevronDown size={16} className="hidden text-ink-300 sm:block" />

          <button
            onClick={() => void logout()}
            className="grid size-10 place-items-center rounded-xl text-ink-500 transition duration-200 hover:bg-ink-50 hover:text-ink-900"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
