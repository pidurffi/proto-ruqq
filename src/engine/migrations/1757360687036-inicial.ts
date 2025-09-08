import { MigrationInterface, QueryRunner } from "typeorm";

export class Inicial1757360687036 implements MigrationInterface {
    name = 'Inicial1757360687036'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "restrictions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "room_type_id" uuid NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "min_length_of_stay" integer, "max_length_of_stay" integer, "closed_to_arrival" boolean NOT NULL DEFAULT false, "closed_to_departure" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_f86a9a487b1348b0349f104154e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "daily_room_rates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "room_type_id" uuid NOT NULL, "date" date NOT NULL, "base_rate" numeric(10,2) NOT NULL, "single_occupancy_rate" numeric(10,2), "extra_person_rate" numeric(10,2), "available_rooms" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "min_stay" integer, "max_stay" integer, "closed_to_arrival" boolean NOT NULL DEFAULT false, "closed_to_departure" boolean NOT NULL DEFAULT false, "last_updated_by" uuid, "pricing_source" character varying(50), CONSTRAINT "PK_75ff522163e43fb66148318245d" PRIMARY KEY ("id")); COMMENT ON COLUMN "daily_room_rates"."date" IS 'UN REGISTRO POR CADA DÍA - Estándar OTA como Booking.com, Airbnb'; COMMENT ON COLUMN "daily_room_rates"."base_rate" IS 'Precio base para la capacidad estándar de la habitación'; COMMENT ON COLUMN "daily_room_rates"."single_occupancy_rate" IS 'Precio especial para 1 persona (opcional)'; COMMENT ON COLUMN "daily_room_rates"."extra_person_rate" IS 'Precio adicional por persona extra'; COMMENT ON COLUMN "daily_room_rates"."available_rooms" IS 'Habitaciones disponibles para reservar en este día específico'; COMMENT ON COLUMN "daily_room_rates"."is_active" IS 'Día vendible (true) o cerrado (false)'; COMMENT ON COLUMN "daily_room_rates"."min_stay" IS 'Estancia mínima requerida para check-ins en este día'; COMMENT ON COLUMN "daily_room_rates"."max_stay" IS 'Estancia máxima permitida para check-ins en este día'; COMMENT ON COLUMN "daily_room_rates"."closed_to_arrival" IS 'No se permiten check-ins en este día (CTA)'; COMMENT ON COLUMN "daily_room_rates"."closed_to_departure" IS 'No se permiten check-outs en este día (CTD)'; COMMENT ON COLUMN "daily_room_rates"."last_updated_by" IS 'Usuario que realizó la última actualización de precio'; COMMENT ON COLUMN "daily_room_rates"."pricing_source" IS 'Origen del precio: manual, channel_manager, dynamic_pricing, api_update'`);
        await queryRunner.query(`CREATE INDEX "idx_daily_rates_availability" ON "daily_room_rates" ("room_type_id", "date", "available_rooms") `);
        await queryRunner.query(`CREATE INDEX "idx_daily_rates_date_active" ON "daily_room_rates" ("date", "is_active") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_daily_rates_main" ON "daily_room_rates" ("room_type_id", "date") `);
        await queryRunner.query(`CREATE TABLE "room_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "code" character varying(10) NOT NULL, "total_inventory" integer NOT NULL DEFAULT '1', "base_capacity" integer NOT NULL, "max_capacity" integer NOT NULL, CONSTRAINT "UQ_7c66eff2d003b866687473ddb08" UNIQUE ("code"), CONSTRAINT "PK_abd0f8a4c8a444a84fa2b343353" PRIMARY KEY ("id")); COMMENT ON COLUMN "room_type"."code" IS 'Código corto, ej: DBL_STE'; COMMENT ON COLUMN "room_type"."total_inventory" IS 'Cantidad total de habitaciones físicas de este tipo'; COMMENT ON COLUMN "room_type"."base_capacity" IS 'Ocupación incluida en el precio estándar'; COMMENT ON COLUMN "room_type"."max_capacity" IS 'Límite máximo de personas'`);
        await queryRunner.query(`CREATE TABLE "quote_template" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_64988db970c1dcf17ff1e65adac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."content_block_type_enum" AS ENUM('GREETING', 'SERVICES', 'TERMS', 'CANCELLATION_POLICY', 'FOOTER', 'GENERAL_INFO')`);
        await queryRunner.query(`CREATE TABLE "content_block" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "content" text NOT NULL, "type" "public"."content_block_type_enum" NOT NULL, CONSTRAINT "PK_7d42d8b42d978acef6d134064f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "quote_template_block" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "quote_template_id" uuid NOT NULL, "content_block_id" uuid NOT NULL, "sort_order" integer NOT NULL, CONSTRAINT "PK_bb5a7292ebc16a604e6ba3b16ed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" text NOT NULL, "password" text NOT NULL, "full_name" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "roles" text array NOT NULL DEFAULT '{user}', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "restrictions" ADD CONSTRAINT "FK_745adf2a599e954d51726d12631" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "daily_room_rates" ADD CONSTRAINT "FK_da3a6718a5af62ded6472daaddc" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quote_template_block" ADD CONSTRAINT "FK_56495ec0ff967fa17f698275504" FOREIGN KEY ("quote_template_id") REFERENCES "quote_template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quote_template_block" ADD CONSTRAINT "FK_00e3075a0d95252450dd1a3c2e0" FOREIGN KEY ("content_block_id") REFERENCES "content_block"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quote_template_block" DROP CONSTRAINT "FK_00e3075a0d95252450dd1a3c2e0"`);
        await queryRunner.query(`ALTER TABLE "quote_template_block" DROP CONSTRAINT "FK_56495ec0ff967fa17f698275504"`);
        await queryRunner.query(`ALTER TABLE "daily_room_rates" DROP CONSTRAINT "FK_da3a6718a5af62ded6472daaddc"`);
        await queryRunner.query(`ALTER TABLE "restrictions" DROP CONSTRAINT "FK_745adf2a599e954d51726d12631"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "quote_template_block"`);
        await queryRunner.query(`DROP TABLE "content_block"`);
        await queryRunner.query(`DROP TYPE "public"."content_block_type_enum"`);
        await queryRunner.query(`DROP TABLE "quote_template"`);
        await queryRunner.query(`DROP TABLE "room_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_daily_rates_main"`);
        await queryRunner.query(`DROP INDEX "public"."idx_daily_rates_date_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_daily_rates_availability"`);
        await queryRunner.query(`DROP TABLE "daily_room_rates"`);
        await queryRunner.query(`DROP TABLE "restrictions"`);
    }

}
