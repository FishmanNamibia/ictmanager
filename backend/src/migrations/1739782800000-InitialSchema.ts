import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1739782800000 implements MigrationInterface {
  name = 'InitialSchema1739782800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" character varying NOT NULL,
        "name" character varying NOT NULL,
        "logoUrl" character varying,
        "active" boolean NOT NULL DEFAULT true,
        "settings" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tenants_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "fullName" character varying NOT NULL,
        "role" character varying(50) NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "department" character varying,
        "jobTitle" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_tenant_email" UNIQUE ("tenant_id", "email"),
        CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_tenant_email" ON "users" ("tenant_id", "email")`);
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid,
        "action" character varying NOT NULL,
        "entity_type" character varying,
        "entity_id" character varying,
        "metadata" jsonb,
        "ip" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_audit_tenant_created" ON "audit_logs" ("tenant_id", "createdAt")`);
    await queryRunner.query(`
      CREATE TABLE "assets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "asset_tag" character varying NOT NULL,
        "name" character varying NOT NULL,
        "type" character varying(50) NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'active',
        "manufacturer" character varying,
        "model" character varying,
        "serialNumber" character varying,
        "purchase_date" date,
        "warranty_end" date,
        "cost" decimal(12,2),
        "assigned_to_user_id" uuid,
        "assigned_to_department" character varying,
        "location" character varying,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assets" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_assets_tenant_tag" ON "assets" ("tenant_id", "asset_tag")`);
    await queryRunner.query(`
      CREATE TABLE "software_licenses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "software_name" character varying NOT NULL,
        "license_key" character varying,
        "license_type" character varying NOT NULL DEFAULT 'perpetual',
        "total_seats" integer NOT NULL DEFAULT 1,
        "used_seats" integer NOT NULL DEFAULT 0,
        "expiry_date" date,
        "vendor_name" character varying,
        "cost" decimal(12,2),
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_software_licenses" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "applications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "business_owner" character varying,
        "ict_owner" character varying,
        "hosting_type" character varying(20) NOT NULL DEFAULT 'on_prem',
        "criticality" character varying(20) NOT NULL DEFAULT 'medium',
        "health_status" character varying NOT NULL DEFAULT 'operational',
        "vendor_name" character varying,
        "dependencies" text,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_applications" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "staff_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "job_title" character varying,
        "department" character varying,
        "reports_to_user_id" uuid,
        "capacity_percent" integer,
        "bio" text,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_staff_tenant_user" UNIQUE ("tenant_id", "user_id"),
        CONSTRAINT "PK_staff_profiles" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "staff_skills" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "staff_profile_id" uuid NOT NULL,
        "skill_name" character varying NOT NULL,
        "level" character varying(20) NOT NULL DEFAULT 'intermediate',
        "certification_name" character varying,
        "certification_expiry" date,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_staff_skills" PRIMARY KEY ("id"),
        CONSTRAINT "FK_staff_skills_profile" FOREIGN KEY ("staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "staff_skills"`);
    await queryRunner.query(`DROP TABLE "staff_profiles"`);
    await queryRunner.query(`DROP TABLE "applications"`);
    await queryRunner.query(`DROP TABLE "software_licenses"`);
    await queryRunner.query(`DROP TABLE "assets"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
