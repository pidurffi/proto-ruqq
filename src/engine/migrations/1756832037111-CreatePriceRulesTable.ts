import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePriceRulesTable1756832037111 implements MigrationInterface {
    name = 'CreatePriceRulesTable1756832037111'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."price_rules_adjustment_type_enum" AS ENUM('fixed_price', 'fixed_amount', 'percentage')`);
        await queryRunner.query(`CREATE TABLE "price_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "room_type_id" uuid NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "days_of_week" integer array NOT NULL, "priority" integer NOT NULL DEFAULT '0', "adjustment_type" "public"."price_rules_adjustment_type_enum" NOT NULL, "adjustment_value" numeric(10,2) NOT NULL, CONSTRAINT "PK_332f84d0bdaa08303a9292653f9" PRIMARY KEY ("id")); COMMENT ON COLUMN "price_rules"."days_of_week" IS 'ISO 8601: Lunes=1, Martes=2, ..., Domingo=7'; COMMENT ON COLUMN "price_rules"."priority" IS 'Para resolver conflictos. Mayor número = mayor prioridad'`);
        await queryRunner.query(`ALTER TABLE "price_rules" ADD CONSTRAINT "FK_6d6a4c369156e723075fbf017a8" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "price_rules" DROP CONSTRAINT "FK_6d6a4c369156e723075fbf017a8"`);
        await queryRunner.query(`DROP TABLE "price_rules"`);
        await queryRunner.query(`DROP TYPE "public"."price_rules_adjustment_type_enum"`);
    }

}
