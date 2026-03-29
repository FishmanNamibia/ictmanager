import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssetControlLayer1763600000000 implements MigrationInterface {
  name = 'AddAssetControlLayer1763600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "assets"
        ADD COLUMN IF NOT EXISTS "description" text,
        ADD COLUMN IF NOT EXISTS "useful_life_months" integer
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "asset_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" character varying NOT NULL,
        "asset_id" character varying NOT NULL,
        "movement_type" character varying(30) NOT NULL,
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "from_location" character varying,
        "to_location" character varying,
        "from_assigned_to_user_id" character varying,
        "to_assigned_to_user_id" character varying,
        "from_assigned_to_name" character varying,
        "to_assigned_to_name" character varying,
        "from_department" character varying,
        "to_department" character varying,
        "from_status" character varying(30),
        "new_status" character varying(30),
        "from_condition" character varying(30),
        "new_condition" character varying(30),
        "reason" text,
        "notes" text,
        "approval_required" boolean NOT NULL DEFAULT false,
        "approval_status" character varying(20) NOT NULL DEFAULT 'not_required',
        "requested_by_user_id" character varying,
        "requested_by_name" character varying,
        "approved_by_user_id" character varying,
        "approved_by_name" character varying,
        "approved_at" TIMESTAMP WITH TIME ZONE,
        "approval_comment" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_asset_movements_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_asset_movements_tenant_asset_occurred" ON "asset_movements" ("tenant_id", "asset_id", "occurred_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_asset_movements_tenant_approval" ON "asset_movements" ("tenant_id", "approval_status")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "asset_verifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" character varying NOT NULL,
        "asset_id" character varying NOT NULL,
        "verification_type" character varying(20) NOT NULL DEFAULT 'spot_check',
        "checked_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "checked_by_user_id" character varying,
        "checked_by_name" character varying,
        "system_location" character varying,
        "actual_location" character varying,
        "system_assigned_to_name" character varying,
        "actual_assigned_to_name" character varying,
        "system_department" character varying,
        "actual_department" character varying,
        "system_status" character varying(30),
        "actual_status" character varying(30),
        "system_condition" character varying(30),
        "actual_condition" character varying(30),
        "variance_detected" boolean NOT NULL DEFAULT false,
        "variance_summary" text,
        "resolved" boolean NOT NULL DEFAULT false,
        "resolution_note" text,
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        "resolved_by_user_id" character varying,
        "resolved_by_name" character varying,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_asset_verifications_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_asset_verifications_tenant_asset_checked" ON "asset_verifications" ("tenant_id", "asset_id", "checked_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_asset_verifications_tenant_variance" ON "asset_verifications" ("tenant_id", "variance_detected", "resolved")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "asset_documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" character varying NOT NULL,
        "asset_id" character varying NOT NULL,
        "document_type" character varying(30) NOT NULL,
        "title" character varying NOT NULL,
        "reference_number" character varying,
        "file_name" character varying NOT NULL,
        "mime_type" character varying NOT NULL,
        "size_bytes" integer NOT NULL,
        "content" bytea NOT NULL,
        "uploaded_by_user_id" character varying,
        "uploaded_by_name" character varying,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_asset_documents_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_asset_documents_tenant_asset_created" ON "asset_documents" ("tenant_id", "asset_id", "created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_asset_documents_tenant_asset_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "asset_documents"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_asset_verifications_tenant_variance"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_asset_verifications_tenant_asset_checked"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "asset_verifications"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_asset_movements_tenant_approval"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_asset_movements_tenant_asset_occurred"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "asset_movements"`);
    await queryRunner.query(`
      ALTER TABLE "assets"
        DROP COLUMN IF EXISTS "useful_life_months",
        DROP COLUMN IF EXISTS "description"
    `);
  }
}
