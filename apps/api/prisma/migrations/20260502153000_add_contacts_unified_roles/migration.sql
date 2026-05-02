CREATE TYPE "ContactRoleType" AS ENUM ('OWNER', 'TENANT', 'BUYER', 'GUARANTOR', 'EXTERNAL_BROKER');

ALTER TYPE "AuditEntityType" ADD VALUE 'CONTACT';

CREATE TABLE "Contact" (
    "id" UUID NOT NULL,
    "personType" "PersonType" NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "document" VARCHAR(20),
    "email" VARCHAR(150),
    "phone" VARCHAR(30),
    "secondaryPhone" VARCHAR(30),
    "zipCode" VARCHAR(12),
    "state" VARCHAR(2),
    "city" VARCHAR(100),
    "district" VARCHAR(100),
    "street" VARCHAR(150),
    "streetNumber" VARCHAR(20),
    "complement" VARCHAR(120),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContactRole" (
    "contactId" UUID NOT NULL,
    "role" "ContactRoleType" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactRole_pkey" PRIMARY KEY ("contactId", "role")
);

ALTER TABLE "Owner" ADD COLUMN "contactId" UUID;
ALTER TABLE "Tenant" ADD COLUMN "contactId" UUID;

CREATE UNIQUE INDEX "Contact_document_key" ON "Contact"("document");
CREATE UNIQUE INDEX "Contact_email_key" ON "Contact"("email");
CREATE UNIQUE INDEX "Contact_phone_key" ON "Contact"("phone");
CREATE INDEX "Contact_fullName_idx" ON "Contact"("fullName");
CREATE INDEX "Contact_isActive_idx" ON "Contact"("isActive");
CREATE INDEX "ContactRole_role_idx" ON "ContactRole"("role");
CREATE UNIQUE INDEX "Owner_contactId_key" ON "Owner"("contactId");
CREATE INDEX "Owner_contactId_idx" ON "Owner"("contactId");
CREATE UNIQUE INDEX "Tenant_contactId_key" ON "Tenant"("contactId");
CREATE INDEX "Tenant_contactId_idx" ON "Tenant"("contactId");

ALTER TABLE "ContactRole" ADD CONSTRAINT "ContactRole_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
