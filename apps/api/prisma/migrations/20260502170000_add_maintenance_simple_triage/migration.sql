ALTER TYPE "MaintenanceTicketType" ADD VALUE 'CONDOMINIUM';

CREATE TYPE "MaintenanceTriageDecision" AS ENUM ('EMERGENCY', 'NEEDS_QUOTE', 'INTERNAL_REPAIR');

ALTER TYPE "MaintenanceTicketHistoryActionType" ADD VALUE 'TRIAGED';

ALTER TABLE "MaintenanceTicket"
ADD COLUMN "triageDecision" "MaintenanceTriageDecision",
ADD COLUMN "triageNotes" TEXT,
ADD COLUMN "triagedAt" TIMESTAMP(3),
ADD COLUMN "triagedByUserId" UUID;

CREATE INDEX "MaintenanceTicket_triagedByUserId_idx" ON "MaintenanceTicket"("triagedByUserId");
CREATE INDEX "MaintenanceTicket_triageDecision_idx" ON "MaintenanceTicket"("triageDecision");

ALTER TABLE "MaintenanceTicket"
ADD CONSTRAINT "MaintenanceTicket_triagedByUserId_fkey"
FOREIGN KEY ("triagedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
