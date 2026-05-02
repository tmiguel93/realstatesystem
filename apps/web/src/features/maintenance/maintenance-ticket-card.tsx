import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { appRoutes } from "@imobiliaria/shared";
import { Clock3, MapPin, UserRound, Wrench } from "lucide-react";
import { StatusBadge } from "@/components/feedback/status-badge";
import { MaintenanceUrgencyBadge } from "@/features/maintenance/maintenance-urgency-badge";
import { buildDetailPath, formatDateTime } from "@/lib/format";
import {
  formatOpenDuration,
  getMaintenanceTriageDecisionLabel,
  getMaintenanceTriageTone,
  getMaintenanceTypeLabel,
} from "@/lib/maintenance";
import { resolveStatusTone } from "@/lib/status";
import type { MaintenanceTicketListItem } from "@/types/domain";

type MaintenanceTicketCardProps = {
  ticket: MaintenanceTicketListItem;
  footer?: ReactNode;
};

export function MaintenanceTicketCard({
  ticket,
  footer,
}: MaintenanceTicketCardProps) {
  return (
    <article className="rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,246,241,0.92))] px-4 py-4 shadow-[0_22px_42px_-30px_rgba(24,57,48,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_52px_-30px_rgba(24,57,48,0.34)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
            {ticket.ticketId}
          </p>
          <Link
            to={buildDetailPath(appRoutes.maintenanceTicketDetail, ticket.id)}
            className="mt-2 inline-block font-display text-xl leading-tight text-ink-950 transition hover:text-brand-700"
          >
            {ticket.title}
          </Link>
        </div>

        <MaintenanceUrgencyBadge urgencyLevel={ticket.urgencyLevel} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge
          label={ticket.statusLabel}
          tone={resolveStatusTone(ticket.status)}
        />
        <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
          <Wrench size={12} />
          {getMaintenanceTypeLabel(ticket.type)}
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getMaintenanceTriageTone(ticket.triageDecision)}`}
        >
          {getMaintenanceTriageDecisionLabel(ticket.triageDecision)}
        </span>
      </div>

      <div className="mt-4 space-y-3 text-sm text-ink-600">
        <div className="flex items-start gap-2">
          <MapPin size={16} className="mt-0.5 text-ink-400" />
          <div>
            <p className="font-semibold text-ink-900">
              {ticket.property.code} - {ticket.property.title}
            </p>
            <p className="mt-1 text-ink-500">{ticket.property.addressSummary}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <UserRound size={16} className="mt-0.5 text-ink-400" />
          <div>
            <p className="font-medium text-ink-800">
              {ticket.tenant?.fullName ?? "Sem locatario vinculado"}
            </p>
            <p className="mt-1 text-ink-500">
              Responsavel: {ticket.assignedToUser?.fullName ?? "Nao definido"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Clock3 size={16} className="mt-0.5 text-ink-400" />
          <div>
            <p className="font-medium text-ink-800">
              Em aberto ha {formatOpenDuration(ticket.openDays)}
            </p>
            <p className="mt-1 text-ink-500">
              Ultima atualizacao em {formatDateTime(ticket.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {footer ? <div className="mt-5 border-t border-ink-200 pt-4">{footer}</div> : null}
    </article>
  );
}
