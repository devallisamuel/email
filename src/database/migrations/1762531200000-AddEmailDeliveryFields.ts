import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailDeliveryFields1762531200000
  implements MigrationInterface
{
  name = 'AddEmailDeliveryFields1762531200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE "email_status_type" AS ENUM ('pending', 'processing', 'completed', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TYPE "email_status_type" ADD VALUE IF NOT EXISTS 'processing';
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "emails" (
        "id" uuid NOT NULL,
        "sender" character varying(320) NOT NULL,
        "recipient" character varying(320) NOT NULL,
        "subject" character varying(998) NOT NULL DEFAULT 'New email',
        "body" text NOT NULL,
        "status" "email_status_type" NOT NULL DEFAULT 'pending',
        "attempts" integer NOT NULL DEFAULT 0,
        "next_attempt_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "processing_started_at" TIMESTAMP WITH TIME ZONE,
        "last_error" text,
        "provider_message_id" character varying(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "delivered_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_emails_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "emails"
        ADD COLUMN IF NOT EXISTS "subject" character varying(998) NOT NULL DEFAULT 'New email',
        ADD COLUMN IF NOT EXISTS "attempts" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "next_attempt_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "processing_started_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "last_error" text,
        ADD COLUMN IF NOT EXISTS "provider_message_id" character varying(255);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "emails_status_next_attempt_at_idx"
      ON "emails" ("status", "next_attempt_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "emails_status_next_attempt_at_idx"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "emails"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "email_status_type"`);
  }
}
