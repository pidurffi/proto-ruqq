import { MigrationInterface, QueryRunner } from 'typeorm'

export class Seeder8000000000000 implements MigrationInterface {
  name = 'Seeder8000000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SUPERADMIN
    // N5v2LAzzfdgsfgssdzfs
    await queryRunner.query(
      `INSERT INTO public.users(
                        "email", "password", "full_name", "is_active", roles, "deleted_at", "created_at", "updated_at", "uid")
                        VALUES ('superadmin@superadmin.com', '$2b$10$UlLzuWw7XxW5tLdgPEsUc.qLS0zJfDBWVYfNKxUUEupWiUrXuGnQS', 'Super Admin', true, '{SUPER_ADMIN}', NULL, '2023-01-01', '2023-01-01', '46d197eb-f80d-4feb-a63d-4c8a57880302')`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(``)
  }
}
