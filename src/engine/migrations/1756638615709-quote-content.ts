import { MigrationInterface, QueryRunner } from 'typeorm'

export class QuoteContent1756638615709 implements MigrationInterface {
  name = 'QuoteContent1756638615709'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "quote_template" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_64988db970c1dcf17ff1e65adac" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."content_block_type_enum" AS ENUM('GREETING', 'SERVICES', 'TERMS', 'CANCELLATION_POLICY', 'FOOTER', 'GENERAL_INFO')`,
    )
    await queryRunner.query(
      `CREATE TABLE "content_block" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "content" text NOT NULL, "type" "public"."content_block_type_enum" NOT NULL, CONSTRAINT "PK_7d42d8b42d978acef6d134064f2" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "quote_template_block" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "quote_template_id" uuid NOT NULL, "content_block_id" uuid NOT NULL, "sort_order" integer NOT NULL, CONSTRAINT "PK_bb5a7292ebc16a604e6ba3b16ed" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "quote_template_block" ADD CONSTRAINT "FK_56495ec0ff967fa17f698275504" FOREIGN KEY ("quote_template_id") REFERENCES "quote_template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "quote_template_block" ADD CONSTRAINT "FK_00e3075a0d95252450dd1a3c2e0" FOREIGN KEY ("content_block_id") REFERENCES "content_block"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quote_template_block" DROP CONSTRAINT "FK_00e3075a0d95252450dd1a3c2e0"`)
    await queryRunner.query(`ALTER TABLE "quote_template_block" DROP CONSTRAINT "FK_56495ec0ff967fa17f698275504"`)
    await queryRunner.query(`DROP TABLE "quote_template_block"`)
    await queryRunner.query(`DROP TABLE "content_block"`)
    await queryRunner.query(`DROP TYPE "public"."content_block_type_enum"`)
    await queryRunner.query(`DROP TABLE "quote_template"`)
  }
}
