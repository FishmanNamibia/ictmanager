import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDisasterRecoveryPlans1763400000000 implements MigrationInterface {
  name = 'AddDisasterRecoveryPlans1763400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "disaster_recovery_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "applicationId" uuid,
        "planName" character varying(255) NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'draft',
        "recoveryTier" character varying(20) NOT NULL DEFAULT 'warm',
        "failoverType" character varying(30) NOT NULL DEFAULT 'manual',
        "recoverySite" character varying(255),
        "alternateSite" character varying(255),
        "recoveryOwner" character varying(255),
        "communicationOwner" character varying(255),
        "activationTrigger" text,
        "backupStrategy" text,
        "replicationScope" text,
        "dependencies" text,
        "runbookUrl" character varying(500),
        "lastDrTestDate" TIMESTAMP,
        "nextDrTestDate" TIMESTAMP,
        "lastBackupVerificationDate" TIMESTAMP,
        "nextBackupVerificationDate" TIMESTAMP,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_disaster_recovery_plans" PRIMARY KEY ("id"),
        CONSTRAINT "FK_disaster_recovery_plans_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_dr_plans_tenant_application" ON "disaster_recovery_plans" ("tenantId", "applicationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_dr_plans_tenant_status" ON "disaster_recovery_plans" ("tenantId", "status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_dr_plans_tenant_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_dr_plans_tenant_application"`);
    await queryRunner.query(`DROP TABLE "disaster_recovery_plans"`);
  }
}
