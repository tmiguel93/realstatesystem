import { useQuery } from "@tanstack/react-query";
import { appRoutes } from "@imobiliaria/shared";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useAuth } from "@/features/auth/auth-context";
import { useI18n } from "@/features/preferences/language-provider";
import { resolveAssetUrl } from "@/lib/assets";
import { formatCurrency, formatDate } from "@/lib/format";
import { getMaintenanceUrgencyTone } from "@/lib/maintenance";
import { resolveStatusTone } from "@/lib/status";
import { tenantPortalService } from "@/services/tenant-portal-service";

export function TenantPortalPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { t } = useI18n();

  const overviewQuery = useQuery({
    queryKey: ["tenant-portal-overview"],
    queryFn: () => tenantPortalService.getOverview(accessToken!),
    enabled: Boolean(accessToken),
  });

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={t("tenantPortal.eyebrow")}
          title={t("tenantPortal.title")}
          description={t("tenantPortal.description")}
        />
        <div className="grid gap-5 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="panel-card skeleton-shimmer h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <EmptyState
        title={t("tenantPortal.title")}
        description={t("tenantPortal.noPortal")}
      />
    );
  }

  const overview = overviewQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("tenantPortal.eyebrow")}
        title={t("tenantPortal.title")}
        description={t("tenantPortal.description")}
        actions={
          <button
            type="button"
            onClick={() => navigate(appRoutes.tenantPortalTicketNew)}
            className="secondary-button"
          >
            {t("tenantPortal.newTicket")}
          </button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <SectionCard
          title={t("tenantPortal.myContracts")}
          description={`${overview.tenant.fullName} · ${overview.tenant.document}`}
        >
          {overview.contracts.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {overview.contracts.map((contract) => (
                <article
                  key={contract.id}
                  className="overflow-hidden rounded-[28px] border border-ink-200 bg-[var(--elevated-bg)]"
                >
                  <div className="h-44 w-full bg-ink-100">
                    {contract.property.coverImageUrl ? (
                      <img
                        src={
                          resolveAssetUrl(contract.property.coverImageUrl) ??
                          contract.property.coverImageUrl
                        }
                        alt={contract.property.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-sm text-ink-400">
                        {t("tenantPortal.noCoverPhoto")}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 px-5 py-5">
                    <div>
                      <p className="font-display text-2xl text-ink-950">
                        {contract.property.title}
                      </p>
                      <p className="mt-1 text-sm text-ink-500">
                        {contract.property.addressSummary}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm text-ink-600">
                      <p>
                        {t("tenantPortal.contractLabel")}: {contract.code}
                      </p>
                      <p>
                        {t("tenantPortal.termLabel")}: {formatDate(contract.startDate)} até{" "}
                        {formatDate(contract.endDate)}
                      </p>
                      <p>
                        {t("tenantPortal.rentLabel")}: {formatCurrency(contract.rentAmount)}
                      </p>
                      <p>
                        {t("tenantPortal.ownerLabel")}: {contract.owner.fullName}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("tenantPortal.myContracts")}
              description={t("tenantPortal.noContracts")}
            />
          )}
        </SectionCard>

        <SectionCard
          title={t("tenantPortal.myTickets")}
          description={t("tenantPortal.recentHistoryDescription")}
        >
          {overview.recentTickets.length ? (
            <div className="space-y-3">
              {overview.recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-[24px] border border-ink-200 bg-[var(--elevated-bg)] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-950">{ticket.ticketId}</p>
                      <p className="mt-1 text-sm text-ink-600">
                        {ticket.propertyCodeSnapshot} · {ticket.propertyTitleSnapshot}
                      </p>
                    </div>
                    <StatusBadge
                      label={ticket.status}
                      tone={resolveStatusTone(ticket.status)}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getMaintenanceUrgencyTone(ticket.urgencyLevel)}`}
                    >
                      {t("tenantPortal.urgencyLabel", {
                        level: ticket.urgencyLevel,
                      })}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-ink-500">
                    {ticket.severityJustification ?? t("tenantPortal.autoAssessment")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("tenantPortal.myTickets")}
              description={t("tenantPortal.emptyRecentTickets")}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
