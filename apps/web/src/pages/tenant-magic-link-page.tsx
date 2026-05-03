import { useQuery } from "@tanstack/react-query";
import {
  appRoutes,
  contractStatusOptions,
  maintenanceTicketStatusOptions,
} from "@imobiliaria/shared";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useI18n } from "@/features/preferences/language-provider";
import { resolveAssetUrl } from "@/lib/assets";
import { buildDetailPath, formatCurrency, formatDate } from "@/lib/format";
import { getMaintenanceUrgencyTone } from "@/lib/maintenance";
import { getOptionLabel } from "@/lib/options";
import { resolveStatusTone } from "@/lib/status";
import { tenantMagicLinkService } from "@/services/tenant-magic-link-service";

export function TenantMagicLinkPage() {
  const { token = "" } = useParams();
  const { t } = useI18n();

  const overviewQuery = useQuery({
    queryKey: ["tenant-magic-link-overview", token],
    queryFn: () => tenantMagicLinkService.getOverview(token),
    enabled: Boolean(token),
    retry: false,
  });

  if (overviewQuery.isLoading) {
    return (
      <main className="min-h-screen bg-[var(--app-bg)] px-6 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <PageHeader
            eyebrow={t("tenantMagicLink.eyebrow")}
            title={t("tenantMagicLink.title")}
            description={t("tenantMagicLink.description")}
          />
          <div className="grid gap-5 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="panel-card skeleton-shimmer h-44" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <main className="min-h-screen bg-[var(--app-bg)] px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title={t("tenantMagicLink.invalidTitle")}
            description={t("tenantMagicLink.invalidDescription")}
          />
        </div>
      </main>
    );
  }

  const overview = overviewQuery.data;
  const ticketPath = buildDetailPath(appRoutes.tenantMagicLinkTicketNew, token);

  return (
    <main className="min-h-screen bg-[var(--app-bg)] px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          eyebrow={t("tenantMagicLink.eyebrow")}
          title={t("tenantMagicLink.title")}
          description={t("tenantMagicLink.description")}
          actions={
            <Link to={ticketPath} className="primary-button">
              {t("tenantMagicLink.openTicket")}
            </Link>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <SectionCard title={overview.property.title}>
            <div className="overflow-hidden rounded-[28px] border border-ink-200 bg-[var(--elevated-bg)]">
              <div className="h-72 bg-ink-100">
                {overview.property.coverImageUrl ? (
                  <img
                    src={
                      resolveAssetUrl(overview.property.coverImageUrl) ??
                      overview.property.coverImageUrl
                    }
                    alt={overview.property.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-ink-400">
                    {t("tenantMagicLink.noCover")}
                  </div>
                )}
              </div>
              <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-ink-400">
                    {t("tenantMagicLink.propertyCode")}
                  </p>
                  <p className="mt-2 text-sm text-ink-800">
                    {overview.property.code}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-ink-400">
                    {t("tenantMagicLink.address")}
                  </p>
                  <p className="mt-2 text-sm text-ink-800">
                    {overview.property.addressSummary}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={t("tenantMagicLink.secureAccess")}
            description={t("tenantMagicLink.secureAccessDescription")}
          >
            <div className="space-y-4 text-sm text-ink-700">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-ink-400">
                  {t("tenantMagicLink.tenant")}
                </p>
                <p className="mt-2 font-semibold text-ink-950">
                  {overview.tenant.fullName}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-ink-400">
                  {t("tenantMagicLink.linkValidity")}
                </p>
                <p className="mt-2">{formatDate(overview.link.expiresAt)}</p>
              </div>
              <div className="rounded-3xl border border-brand-200 bg-brand-50/70 px-4 py-4 text-brand-900">
                {t("tenantMagicLink.securityNote")}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <SectionCard title={t("tenantMagicLink.contractTitle")}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-ink-400">
                  {t("tenantMagicLink.contractCode")}
                </p>
                <p className="mt-2 text-sm text-ink-800">
                  {overview.contract.code}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-ink-400">
                  {t("tenantMagicLink.status")}
                </p>
                <div className="mt-2">
                  <StatusBadge
                    label={getOptionLabel(
                      contractStatusOptions,
                      overview.contract.status,
                    )}
                    tone={resolveStatusTone(overview.contract.status)}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-ink-400">
                  {t("tenantMagicLink.term")}
                </p>
                <p className="mt-2 text-sm text-ink-800">
                  {formatDate(overview.contract.startDate)} -{" "}
                  {formatDate(overview.contract.endDate)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-ink-400">
                  {t("tenantMagicLink.rent")}
                </p>
                <p className="mt-2 text-sm text-ink-800">
                  {formatCurrency(overview.contract.rentAmount)} ·{" "}
                  {t("tenantMagicLink.dueDay", {
                    day: overview.contract.dueDay,
                  })}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={t("tenantMagicLink.documentsTitle")}
            description={t("tenantMagicLink.documentsDescription")}
          >
            {overview.documents.length ? (
              <div className="space-y-3">
                {overview.documents.map((document) => (
                  <a
                    key={document.id}
                    href={document.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-ink-200 bg-[var(--elevated-bg)] px-4 py-3 text-sm text-brand-700 transition hover:border-brand-200 hover:text-brand-800"
                  >
                    {document.name}
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t("tenantMagicLink.noDocumentsTitle")}
                description={t("tenantMagicLink.noDocumentsDescription")}
              />
            )}
          </SectionCard>
        </div>

        <SectionCard
          title={t("tenantMagicLink.ticketsTitle")}
          description={t("tenantMagicLink.ticketsDescription")}
        >
          {overview.recentTickets.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {overview.recentTickets.map((ticket) => (
                <article
                  key={ticket.id}
                  className="rounded-[26px] border border-ink-200 bg-[var(--elevated-bg)] px-5 py-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-950">{ticket.ticketId}</p>
                      <p className="mt-1 text-sm text-ink-500">{ticket.title}</p>
                    </div>
                    <StatusBadge
                      label={getOptionLabel(
                        maintenanceTicketStatusOptions,
                        ticket.status,
                      )}
                      tone={resolveStatusTone(ticket.status)}
                    />
                  </div>
                  <span
                    className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getMaintenanceUrgencyTone(ticket.urgencyLevel)}`}
                  >
                    {t("tenantMagicLink.urgency", {
                      level: ticket.urgencyLevel,
                    })}
                  </span>
                  <p className="mt-3 text-sm text-ink-500">
                    {ticket.severityJustification ??
                      t("tenantMagicLink.autoAssessment")}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("tenantMagicLink.noTicketsTitle")}
              description={t("tenantMagicLink.noTicketsDescription")}
            />
          )}
        </SectionCard>
      </div>
    </main>
  );
}
