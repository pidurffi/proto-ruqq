import { MigrationInterface, QueryRunner } from 'typeorm'

export class Inicial1704193894321 implements MigrationInterface {
  name = 'Inicial1704193894321'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" text NOT NULL, "password" text NOT NULL, "full_name" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "roles" text array NOT NULL DEFAULT '{user}', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    )

    // N5v2LAzzfdgsfgssdzfs
    await queryRunner.query(
      `INSERT INTO public.users(
                      "email", "password", "full_name", "is_active", roles, "deleted_at", "created_at", "updated_at", "uid")
                      VALUES ('superadmin@superadmin.com', '$2b$10$UlLzuWw7XxW5tLdgPEsUc.qLS0zJfDBWVYfNKxUUEupWiUrXuGnQS', 'Super Admin', true, '{SUPER_ADMIN}', NULL, '2023-01-01', '2023-01-01', '46d197eb-f80d-4feb-a63d-4c8a57880302')`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`)
  }
}
