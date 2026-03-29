import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotifications1763300000000 implements MigrationInterface {
  name = 'AddNotifications1763300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "type" character varying(100) NOT NULL,
        "severity" character varying(20) NOT NULL DEFAULT 'info',
        "title" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "linkUrl" character varying(500),
        "metadata" jsonb,
        "externalKey" character varying(255),
        "readAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_user_read_created" ON "notifications" ("tenant_id", "user_id", "readAt", "createdAt")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_notifications_external_key" ON "notifications" ("externalKey") WHERE "externalKey" IS NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_external_key"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_user_read_created"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
