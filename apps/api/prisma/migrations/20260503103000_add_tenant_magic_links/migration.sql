CREATE TYPE "TenantMagicLinkStatus" AS ENUM (
  'ACTIVE',
  'REVOKED',
  'EXPIRED'
);

ALTER TYPE "AuditEntityType" ADD VALUE 'TENANT_MAGIC_LINK';

ALTER TABLE "MaintenanceTicket"
ADD COLUMN "tenantMagicLinkId" UUID;

CREATE TABLE "TenantMagicLink" (
  "id" UUID NOT NULL,
  "contractId" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "tokenHash" VARCHAR(96) NOT NULL,
  "tokenCiphertext" TEXT NOT NULL,
  "tokenPreview" VARCHAR(24) NOT NULL,
  "status" "TenantMagicLinkStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "lastAccessedAt" TIMESTAMP(3),
  "lastAccessIpAddress" VARCHAR(64),
  "lastAccessUserAgent" VARCHAR(255),
  "createdByUserId" UUID NOT NULL,
  "revokedByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantMagicLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantMagicLink_tokenHash_key"
ON "TenantMagicLink"("tokenHash");

CREATE INDEX "TenantMagicLink_contractId_status_idx"
ON "TenantMagicLink"("contractId", "status");

CREATE INDEX "TenantMagicLink_tenantId_status_idx"
ON "TenantMagicLink"("tenantId", "status");

CREATE INDEX "TenantMagicLink_expiresAt_idx"
ON "TenantMagicLink"("expiresAt");

CREATE INDEX "TenantMagicLink_createdByUserId_idx"
ON "TenantMagicLink"("createdByUserId");

CREATE INDEX "TenantMagicLink_revokedByUserId_idx"
ON "TenantMagicLink"("revokedByUserId");

CREATE INDEX "MaintenanceTicket_tenantMagicLinkId_idx"
ON "MaintenanceTicket"("tenantMagicLinkId");

ALTER TABLE "TenantMagicLink"
ADD CONSTRAINT "TenantMagicLink_contractId_fkey"
FOREIGN KEY ("contractId") REFERENCES "Contract"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenantMagicLink"
ADD CONSTRAINT "TenantMagicLink_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenantMagicLink"
ADD CONSTRAINT "TenantMagicLink_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TenantMagicLink"
ADD CONSTRAINT "TenantMagicLink_revokedByUserId_fkey"
FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MaintenanceTicket"
ADD CONSTRAINT "MaintenanceTicket_tenantMagicLinkId_fkey"
FOREIGN KEY ("tenantMagicLinkId") REFERENCES "TenantMagicLink"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
