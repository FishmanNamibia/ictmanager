import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPolicyGovernanceSchema1740130000000 implements MigrationInterface {
  name = 'AddPolicyGovernanceSchema1740130000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "policies"
        ADD COLUMN IF NOT EXISTS "policy_document_type" character varying(20) NOT NULL DEFAULT 'policy',
        ADD COLUMN IF NOT EXISTS "ict_owner" character varying
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "policy_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "policy_id" uuid NOT NULL,
        "version_label" character varying(50) NOT NULL,
        "document_url" character varying,
        "change_summary" text,
        "uploaded_by" character varying(255),
        "is_current" boolean NOT NULL DEFAULT false,
        "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_policy_versions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "policy_workflow_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "policy_id" uuid NOT NULL,
        "action" character varying(60) NOT NULL,
        "from_status" character varying(20),
        "to_status" character varying(20),
        "actor_user_id" character varying,
        "actor_name" character varying(255),
        "comments" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_policy_workflow_events" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "policy_ack_scopes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "policy_id" uuid NOT NULL,
        "role" character varying(50),
        "department" character varying(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_policy_ack_scopes" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "policy_applications" (
        "policy_id" uuid NOT NULL,
        "application_id" uuid NOT NULL,
        CONSTRAINT "PK_policy_applications" PRIMARY KEY ("policy_id", "application_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "policy_assets" (
        "policy_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        CONSTRAINT "PK_policy_assets" PRIMARY KEY ("policy_id", "asset_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "policy_software_licenses" (
        "policy_id" uuid NOT NULL,
        "license_id" uuid NOT NULL,
        CONSTRAINT "PK_policy_software_licenses" PRIMARY KEY ("policy_id", "license_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_policy_versions_tenant" ON "policy_versions" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_policy_versions_tenant_policy" ON "policy_versions" ("tenant_id", "policy_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_policy_workflow_tenant" ON "policy_workflow_events" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_policy_workflow_tenant_policy" ON "policy_workflow_events" ("tenant_id", "policy_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_policy_scope_tenant" ON "policy_ack_scopes" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_policy_scope_tenant_policy" ON "policy_ack_scopes" ("tenant_id", "policy_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_policy_applications_policy" ON "policy_applications" ("policy_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_policy_applications_application" ON "policy_applications" ("application_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_policy_assets_policy" ON "policy_assets" ("policy_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_policy_assets_asset" ON "policy_assets" ("asset_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_policy_licenses_policy" ON "policy_software_licenses" ("policy_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_policy_licenses_license" ON "policy_software_licenses" ("license_id")
    `);

    await queryRunner.query(`
      WITH ranked_versions AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY tenant_id, policy_id
            ORDER BY uploaded_at DESC, id DESC
          ) AS rn
        FROM policy_versions
        WHERE is_current = true
      )
      UPDATE policy_versions pv
      SET is_current = false
      FROM ranked_versions rv
      WHERE pv.id = rv.id
        AND rv.rn > 1
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'policy_acknowledgements') THEN
          WITH ranked_ack AS (
            SELECT
              id,
              ROW_NUMBER() OVER (
                PARTITION BY tenant_id, policy_id, user_id
                ORDER BY acknowledged_at DESC, id DESC
              ) AS rn
            FROM policy_acknowledgements
          )
          DELETE FROM policy_acknowledgements a
          USING ranked_ack ra
          WHERE a.id = ra.id
            AND ra.rn > 1;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_policy_versions_current" ON "policy_versions" ("tenant_id", "policy_id") WHERE "is_current" = true
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'policy_acknowledgements') THEN
          CREATE UNIQUE INDEX IF NOT EXISTS "UQ_policy_ack_tenant_policy_user" ON "policy_acknowledgements" ("tenant_id", "policy_id", "user_id");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'policies')
        AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_policy_versions_policy') THEN
          ALTER TABLE "policy_versions"
          ADD CONSTRAINT "FK_policy_versions_policy"
          FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'policies')
        AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_policy_workflow_policy') THEN
          ALTER TABLE "policy_workflow_events"
          ADD CONSTRAINT "FK_policy_workflow_policy"
          FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'policies')
        AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_policy_scope_policy') THEN
          ALTER TABLE "policy_ack_scopes"
          ADD CONSTRAINT "FK_policy_scope_policy"
          FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_policy_applications_policy') THEN
          ALTER TABLE "policy_applications"
          ADD CONSTRAINT "FK_policy_applications_policy"
          FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_policy_applications_application') THEN
          ALTER TABLE "policy_applications"
          ADD CONSTRAINT "FK_policy_applications_application"
          FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_policy_assets_policy') THEN
          ALTER TABLE "policy_assets"
          ADD CONSTRAINT "FK_policy_assets_policy"
          FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_policy_assets_asset') THEN
          ALTER TABLE "policy_assets"
          ADD CONSTRAINT "FK_policy_assets_asset"
          FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_policy_licenses_policy') THEN
          ALTER TABLE "policy_software_licenses"
          ADD CONSTRAINT "FK_policy_licenses_policy"
          FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_policy_licenses_license') THEN
          ALTER TABLE "policy_software_licenses"
          ADD CONSTRAINT "FK_policy_licenses_license"
          FOREIGN KEY ("license_id") REFERENCES "software_licenses"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "policy_software_licenses" DROP CONSTRAINT IF EXISTS "FK_policy_licenses_license"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "policy_software_licenses" DROP CONSTRAINT IF EXISTS "FK_policy_licenses_policy"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "policy_assets" DROP CONSTRAINT IF EXISTS "FK_policy_assets_asset"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "policy_assets" DROP CONSTRAINT IF EXISTS "FK_policy_assets_policy"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "policy_applications" DROP CONSTRAINT IF EXISTS "FK_policy_applications_application"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "policy_applications" DROP CONSTRAINT IF EXISTS "FK_policy_applications_policy"`);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "policy_ack_scopes" DROP CONSTRAINT IF EXISTS "FK_policy_scope_policy"
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "policy_workflow_events" DROP CONSTRAINT IF EXISTS "FK_policy_workflow_policy"
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "policy_versions" DROP CONSTRAINT IF EXISTS "FK_policy_versions_policy"
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_policy_ack_tenant_policy_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_policy_versions_current"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_scope_tenant_policy"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_scope_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_workflow_tenant_policy"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_workflow_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_versions_tenant_policy"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_versions_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_licenses_license"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_licenses_policy"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_assets_asset"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_assets_policy"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_applications_application"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_applications_policy"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "policy_ack_scopes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "policy_workflow_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "policy_versions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "policy_software_licenses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "policy_assets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "policy_applications"`);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "policies"
        DROP COLUMN IF EXISTS "ict_owner",
        DROP COLUMN IF EXISTS "policy_document_type"
    `);
  }
}
