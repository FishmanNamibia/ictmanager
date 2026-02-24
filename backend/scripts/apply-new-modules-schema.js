const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://root:root@localhost:5432/iictms',
});

async function applyNewSchemas() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Data Governance Schema
    const dataGovernanceSQL = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- DataAsset table
      CREATE TABLE IF NOT EXISTS "data_asset" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "classification" character varying NOT NULL DEFAULT 'INTERNAL',
        "assetType" character varying NOT NULL DEFAULT 'DATABASE',
        "owner" character varying,
        "steward" character varying,
        "recordCount" bigint DEFAULT 0,
        "lastAccessedDate" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_data_asset" PRIMARY KEY ("id"),
        CONSTRAINT "FK_data_asset_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_data_asset_tenant" ON "data_asset" ("tenant_id");
      CREATE INDEX IF NOT EXISTS "IDX_data_asset_classification" ON "data_asset" ("classification");
      CREATE INDEX IF NOT EXISTS "IDX_data_asset_type" ON "data_asset" ("assetType");

      -- DataProcessingRecord table
      CREATE TABLE IF NOT EXISTS "data_processing_record" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "dataAssetId" uuid,
        "purpose" character varying NOT NULL DEFAULT 'BUSINESS_OPERATIONS',
        "processor" character varying,
        "consentStatus" character varying NOT NULL DEFAULT 'PENDING',
        "dpiaRequired" boolean DEFAULT false,
        "dpiaCompleted" boolean DEFAULT false,
        "dpiaDate" timestamp,
        "retentionDate" timestamp,
        "securityMeasures" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_data_processing_record" PRIMARY KEY ("id"),
        CONSTRAINT "FK_data_processing_record_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_data_processing_record_asset" FOREIGN KEY ("dataAssetId") REFERENCES "data_asset"("id") ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_data_processing_record_tenant" ON "data_processing_record" ("tenant_id");
      CREATE INDEX IF NOT EXISTS "IDX_data_processing_record_asset" ON "data_processing_record" ("dataAssetId");
      CREATE INDEX IF NOT EXISTS "IDX_data_processing_record_consent" ON "data_processing_record" ("consentStatus");

      -- DataQualityMetric table
      CREATE TABLE IF NOT EXISTS "data_quality_metric" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "dataAssetId" uuid,
        "dimension" character varying NOT NULL,
        "score" integer NOT NULL DEFAULT 0,
        "findings" text,
        "remediationPlan" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_data_quality_metric" PRIMARY KEY ("id"),
        CONSTRAINT "FK_data_quality_metric_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_data_quality_metric_asset" FOREIGN KEY ("dataAssetId") REFERENCES "data_asset"("id") ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_data_quality_metric_tenant" ON "data_quality_metric" ("tenant_id");
      CREATE INDEX IF NOT EXISTS "IDX_data_quality_metric_asset" ON "data_quality_metric" ("dataAssetId");
      CREATE INDEX IF NOT EXISTS "IDX_data_quality_metric_dimension" ON "data_quality_metric" ("dimension");

      -- ServiceTicket table
      CREATE TABLE IF NOT EXISTS "service_ticket" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "ticketNumber" character varying NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "status" character varying NOT NULL DEFAULT 'OPEN',
        "priority" character varying NOT NULL DEFAULT 'MEDIUM',
        "requestType" character varying NOT NULL DEFAULT 'INCIDENT',
        "requestedBy" character varying,
        "assignedTo" character varying,
        "dueDate" timestamp,
        "resolvedDate" timestamp,
        "resolution" text,
        "commentCount" integer DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_ticket" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_service_ticket_number" UNIQUE ("tenant_id", "ticketNumber"),
        CONSTRAINT "FK_service_ticket_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_service_ticket_tenant" ON "service_ticket" ("tenant_id");
      CREATE INDEX IF NOT EXISTS "IDX_service_ticket_status" ON "service_ticket" ("status");
      CREATE INDEX IF NOT EXISTS "IDX_service_ticket_priority" ON "service_ticket" ("priority");
      CREATE INDEX IF NOT EXISTS "IDX_service_ticket_number" ON "service_ticket" ("ticketNumber");

      -- TicketComment table
      CREATE TABLE IF NOT EXISTS "ticket_comment" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticket_id" uuid NOT NULL,
        "commentBy" character varying NOT NULL,
        "content" text NOT NULL,
        "isInternal" boolean DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ticket_comment" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ticket_comment_ticket" FOREIGN KEY ("ticket_id") REFERENCES "service_ticket"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_ticket_comment_ticket" ON "ticket_comment" ("ticket_id");

      -- IctProject table
      CREATE TABLE IF NOT EXISTS "ict_project" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "projectName" character varying NOT NULL,
        "description" text,
        "status" character varying NOT NULL DEFAULT 'PLANNING',
        "currentPhase" character varying NOT NULL DEFAULT 'INITIATION',
        "projectManager" character varying,
        "sponsor" character varying,
        "budget" numeric(15,2),
        "scope" text,
        "completionPercentage" integer DEFAULT 0,
        "objectives" text,
        "deliverables" text,
        "risks" text,
        "notes" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ict_project" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ict_project_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_ict_project_tenant" ON "ict_project" ("tenant_id");
      CREATE INDEX IF NOT EXISTS "IDX_ict_project_status" ON "ict_project" ("status");
      CREATE INDEX IF NOT EXISTS "IDX_ict_project_phase" ON "ict_project" ("currentPhase");

      -- ProjectMilestone table
      CREATE TABLE IF NOT EXISTS "project_milestone" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "project_id" uuid NOT NULL,
        "milestoneName" character varying NOT NULL,
        "description" text,
        "status" character varying NOT NULL DEFAULT 'PLANNED',
        "targetDate" timestamp,
        "completionDate" timestamp,
        "deliverable" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_milestone" PRIMARY KEY ("id"),
        CONSTRAINT "FK_project_milestone_project" FOREIGN KEY ("project_id") REFERENCES "ict_project"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_project_milestone_project" ON "project_milestone" ("project_id");
      CREATE INDEX IF NOT EXISTS "IDX_project_milestone_status" ON "project_milestone" ("status");
    `;

    await client.query(dataGovernanceSQL);
    console.log('✓ Data Governance, Service Desk, and ICT Projects schemas created');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyNewSchemas();
