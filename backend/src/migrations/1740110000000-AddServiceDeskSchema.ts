import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceDeskSchema1740110000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_tickets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "ticketNumber" character varying(50) NOT NULL,
        "title" character varying(500) NOT NULL,
        "description" text,
        "requestType" character varying(50) NOT NULL DEFAULT 'service_request',
        "category" character varying(100),
        "status" character varying(50) NOT NULL DEFAULT 'open',
        "priority" character varying(50) NOT NULL DEFAULT 'medium',
        "reportedBy" character varying(255) NOT NULL,
        "assignedTo" character varying(255),
        "dueDate" TIMESTAMP,
        "resolvedDate" TIMESTAMP,
        "resolution" text,
        "commentCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_tickets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_service_tickets_tenant_ticket" UNIQUE ("tenantId", "ticketNumber")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ticket_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticketId" uuid NOT NULL,
        "commentBy" character varying(255) NOT NULL,
        "content" text NOT NULL,
        "isInternal" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ticket_comments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_tickets_tenant" ON "service_tickets" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_tickets_status" ON "service_tickets" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_tickets_priority" ON "service_tickets" ("priority")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ticket_comments_ticket" ON "ticket_comments" ("ticketId")`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_service_tickets_tenant') THEN
          ALTER TABLE "service_tickets"
          ADD CONSTRAINT "FK_service_tickets_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ticket_comments_ticket') THEN
          ALTER TABLE "ticket_comments"
          ADD CONSTRAINT "FK_ticket_comments_ticket"
          FOREIGN KEY ("ticketId") REFERENCES "service_tickets"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "ticket_comments" DROP CONSTRAINT IF EXISTS "FK_ticket_comments_ticket"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "service_tickets" DROP CONSTRAINT IF EXISTS "FK_service_tickets_tenant"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ticket_comments_ticket"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_tickets_priority"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_tickets_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_tickets_tenant"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_tickets"`);
  }
}
