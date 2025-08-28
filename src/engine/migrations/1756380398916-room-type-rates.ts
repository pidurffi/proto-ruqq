import { MigrationInterface, QueryRunner } from "typeorm";

export class RoomTypeRates1756380398916 implements MigrationInterface {
    name = 'RoomTypeRates1756380398916'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "room_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "code" character varying(10) NOT NULL, "total_inventory" integer NOT NULL DEFAULT '1', CONSTRAINT "UQ_7c66eff2d003b866687473ddb08" UNIQUE ("code"), CONSTRAINT "PK_abd0f8a4c8a444a84fa2b343353" PRIMARY KEY ("id")); COMMENT ON COLUMN "room_type"."code" IS 'Código corto, ej: DBL_STE'; COMMENT ON COLUMN "room_type"."total_inventory" IS 'Cantidad total de habitaciones físicas de este tipo'`);
        await queryRunner.query(`CREATE TABLE "base_rate_period" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "room_type_id" uuid NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "price" numeric(10,2) NOT NULL, CONSTRAINT "PK_904b8f6d8b79125a8c11cb1220c" PRIMARY KEY ("id")); COMMENT ON COLUMN "base_rate_period"."price" IS 'Precio base que aplica a todo el rango'`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" text NOT NULL, "password" text NOT NULL, "full_name" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "roles" text array NOT NULL DEFAULT '{user}', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "base_rate_period" ADD CONSTRAINT "FK_7e8193272a7300db32ac92798db" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "base_rate_period" DROP CONSTRAINT "FK_7e8193272a7300db32ac92798db"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "base_rate_period"`);
        await queryRunner.query(`DROP TABLE "room_type"`);
    }

}
