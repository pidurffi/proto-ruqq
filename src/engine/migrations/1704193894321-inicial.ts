import { MigrationInterface, QueryRunner } from 'typeorm'

export class Inicial1704193894321 implements MigrationInterface {
  name = 'Inicial1704193894321'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "entidad_relacion" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "nombre" character varying(50) NOT NULL, "entidad_modelo_id" uuid, CONSTRAINT "PK_002ca7ceb845e9451eda80c973d" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "entidadmodelo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "nombre" character varying(50) NOT NULL, "descripcion" character varying(255) NOT NULL, CONSTRAINT "PK_f07b23716898e8c71b19aac8f74" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "description" character varying(100) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "modules" text array NOT NULL DEFAULT '{}', CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" text NOT NULL, "password" text NOT NULL, "full_name" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "roles" text array NOT NULL DEFAULT '{user}', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "entidad_relacion" ADD CONSTRAINT "FK_3c1801d2c7202529159c7e9c913" FOREIGN KEY ("entidad_modelo_id") REFERENCES "entidadmodelo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )

    await queryRunner.query(
      `INSERT INTO public.users(
                      "email", "password", "full_name", "is_active", roles, "deleted_at", "created_at", "updated_at", "uid")
                      VALUES ('superadmin@superadmin.com', '$2b$10$UlLzuWw7XxW5tLdgPEsUc.qLS0zJfDBWVYfNKxUUEupWiUrXuGnQS', 'Super Admin', true, '{SUPER_ADMIN}', NULL, '2023-01-01', '2023-01-01', '46d197eb-f80d-4feb-a63d-4c8a57880302')`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "entidad_relacion" DROP CONSTRAINT "FK_3c1801d2c7202529159c7e9c913"`)
    await queryRunner.query(`DROP TABLE "users"`)
    await queryRunner.query(`DROP TABLE "roles"`)
    await queryRunner.query(`DROP TABLE "entidadmodelo"`)
    await queryRunner.query(`DROP TABLE "entidad_relacion"`)
  }
}
