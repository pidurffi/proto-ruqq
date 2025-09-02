import { MigrationInterface, QueryRunner } from 'typeorm'

export class Restricciones1756722017410 implements MigrationInterface {
  name = 'Restricciones1756722017410'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "restrictions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "room_type_id" uuid NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "min_length_of_stay" integer, "max_length_of_stay" integer, "closed_to_arrival" boolean NOT NULL DEFAULT false, "closed_to_departure" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_f86a9a487b1348b0349f104154e" PRIMARY KEY ("id"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "restrictions"`)
  }
}
