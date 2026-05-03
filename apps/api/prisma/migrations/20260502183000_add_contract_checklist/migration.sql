CREATE TYPE "ContractChecklistItemType" AS ENUM (
  'DOCUMENTS',
  'BANK_DETAILS',
  'GUARANTEE',
  'DUE_DAY',
  'INSPECTION',
  'APPROVAL'
);

CREATE TYPE "ContractChecklistItemStatus" AS ENUM (
  'PENDING',
  'IN_ANALYSIS',
  'APPROVED',
  'REJECTED',
  'NOT_APPLICABLE'
);

ALTER TABLE "Contract"
ADD COLUMN "checklistOverrideReason" TEXT,
ADD COLUMN "checklistOverrideApprovedAt" TIMESTAMP(3),
ADD COLUMN "checklistOverrideApprovedByUserId" UUID;

CREATE TABLE "ContractChecklistItem" (
  "id" UUID NOT NULL,
  "contractId" UUID NOT NULL,
  "itemType" "ContractChecklistItemType" NOT NULL,
  "status" "ContractChecklistItemStatus" NOT NULL DEFAULT 'PENDING',
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "responsibleUserId" UUID,
  "completedAt" TIMESTAMP(3),
  "completedByUserId" UUID,
  "notes" TEXT,
  "attachmentFileUrl" VARCHAR(500),
  "exceptionJustification" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContractChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContractChecklistItem_contractId_itemType_key"
ON "ContractChecklistItem"("contractId", "itemType");

CREATE INDEX "ContractChecklistItem_contractId_status_idx"
ON "ContractChecklistItem"("contractId", "status");

CREATE INDEX "ContractChecklistItem_itemType_idx"
ON "ContractChecklistItem"("itemType");

CREATE INDEX "ContractChecklistItem_responsibleUserId_idx"
ON "ContractChecklistItem"("responsibleUserId");

CREATE INDEX "ContractChecklistItem_completedByUserId_idx"
ON "ContractChecklistItem"("completedByUserId");

CREATE INDEX "Contract_checklistOverrideApprovedByUserId_idx"
ON "Contract"("checklistOverrideApprovedByUserId");

ALTER TABLE "Contract"
ADD CONSTRAINT "Contract_checklistOverrideApprovedByUserId_fkey"
FOREIGN KEY ("checklistOverrideApprovedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContractChecklistItem"
ADD CONSTRAINT "ContractChecklistItem_contractId_fkey"
FOREIGN KEY ("contractId") REFERENCES "Contract"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContractChecklistItem"
ADD CONSTRAINT "ContractChecklistItem_responsibleUserId_fkey"
FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContractChecklistItem"
ADD CONSTRAINT "ContractChecklistItem_completedByUserId_fkey"
FOREIGN KEY ("completedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
