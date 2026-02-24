-- ICT Policies & Governance: run with psql -U root -d iictms -f backend/scripts/policies-migration.sql
CREATE TABLE IF NOT EXISTS "policies" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id" uuid NOT NULL,
  "title" character varying(255) NOT NULL,
  "policy_type" character varying(50) NOT NULL DEFAULT 'other',
  "status" character varying(20) NOT NULL DEFAULT 'draft',
  "responsible_owner" character varying,
  "last_review_date" date,
  "next_review_due" date,
  "document_url" character varying,
  "notes" text,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_policies" PRIMARY KEY ("id"),
  CONSTRAINT "FK_policies_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IDX_policies_tenant" ON "policies" ("tenant_id");
CREATE INDEX IF NOT EXISTS "IDX_policies_tenant_status" ON "policies" ("tenant_id", "status");
