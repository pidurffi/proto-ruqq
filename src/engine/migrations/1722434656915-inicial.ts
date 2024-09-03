import { MigrationInterface, QueryRunner } from 'typeorm'

export class Inicial1722434656915 implements MigrationInterface {
  name = 'Inicial1722434656915'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hotel_img" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "file_path" character varying(255) NOT NULL, "description" character varying(255), "hotel_id" uuid, CONSTRAINT "PK_13088b37d3765401680e6490d1f" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "hotel" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "img_cover_path" text NOT NULL, "img_cover_thumb_path" text NOT NULL, "section_title" character varying(255) NOT NULL DEFAULT 'El Complejo', "address" character varying(255) NOT NULL, "phone" character varying(20) NOT NULL, "description" text NOT NULL, "whatsapp" character varying(20), "instagram" character varying(255), "facebook" character varying(255), "gps_coords" character varying(255), "email" character varying(255) NOT NULL, CONSTRAINT "PK_3a62ac86b369b36c1a297e9ab26" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "hotel_service" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "hotel_id" uuid, "service_id" uuid, CONSTRAINT "PK_077fbfb412946a9432f3b8888b0" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2b359d776af3c1e24b1e16f519" ON "hotel_service" ("hotel_id", "service_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "service" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "description" character varying(255), CONSTRAINT "PK_85a21558c006647cd76fdce044b" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "section_img" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "file_path" character varying(255) NOT NULL, "section_id" uuid, CONSTRAINT "PK_94f077711f78f28f187e3e95957" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "section" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying(255), "text" character varying(1024), "button" boolean NOT NULL DEFAULT false, "button_url" character varying(512), "button_text" character varying(255), CONSTRAINT "PK_3c41d2d699384cc5e8eac54777d" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "equipment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "description" character varying(255), CONSTRAINT "PK_0722e1b9d6eb19f5874c1678740" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "room_equipment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "room_id" uuid, "equipment_id" uuid, CONSTRAINT "PK_dc7fc78653d39b1b4755474b27c" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e9677afbb554371b8c87c9e889" ON "room_equipment" ("room_id", "equipment_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "room" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" text NOT NULL, "slug" text NOT NULL, "img_cover_path" text NOT NULL, "img_cover_thumb_path" text NOT NULL, "short_description" text NOT NULL, "full_description" text, "area" integer, "qty_pax" integer NOT NULL, "qty_bath" integer NOT NULL, "qty_rooms" integer NOT NULL, "is_open" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_535c742a3606d2e3122f441b26c" UNIQUE ("name"), CONSTRAINT "PK_c6d46db005d623e691b2fbcba23" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "room_img" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "img_path" character varying(255) NOT NULL, "img_thumb_path" character varying(255) NOT NULL, "room_id" uuid, CONSTRAINT "PK_16ca4bfaab973d1325855502128" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "meta_data" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying(255) NOT NULL, "description" character varying(500) NOT NULL, "keywords" character varying(255), "canonical_url" character varying(255), "og_title" character varying(255), "og_description" character varying(500), "og_image" character varying(255), "og_url" character varying(255), "twitter_title" character varying(255), "twitter_description" character varying(500), "twitter_image" character varying(255), "robots" character varying(255), CONSTRAINT "PK_fc43762ebfedfc282ee84ba63d3" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "contact-form" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" text NOT NULL, "phone" text NOT NULL, "email" text NOT NULL, "date_in" date, "date_out" date, "message" text NOT NULL, CONSTRAINT "PK_8f8042e8af2200b56e938e8fb91" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "banner" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "img_path" text, "thumb_path" text, "title" text NOT NULL, "subtitle" text, "description" text NOT NULL, "button_enabled" boolean NOT NULL, "is_promo" boolean NOT NULL, "button_text" text, "button_link" text, "date_in" date, "date_out" date, "enabled" boolean NOT NULL, "order" integer, CONSTRAINT "UQ_b8b80e0074a71ba482e2f1b92a5" UNIQUE ("title"), CONSTRAINT "PK_6d9e2570b3d85ba37b681cd4256" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" text NOT NULL, "password" text NOT NULL, "full_name" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "roles" text array NOT NULL DEFAULT '{user}', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "hotel_img" ADD CONSTRAINT "FK_b77c1637ca0f074309e73c79e4b" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "hotel_service" ADD CONSTRAINT "FK_d3c8b9b4f285df3a0060c73fa76" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "hotel_service" ADD CONSTRAINT "FK_c1cbe434b7211c54353f3445e7f" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "section_img" ADD CONSTRAINT "FK_9cf7fe5c96f747c2c11641c064b" FOREIGN KEY ("section_id") REFERENCES "section"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "room_equipment" ADD CONSTRAINT "FK_247edb0bcefa28936254ed577bd" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "room_equipment" ADD CONSTRAINT "FK_6c8e11c59351fefc6655dc35c1b" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "room_img" ADD CONSTRAINT "FK_48d1af8311e010cfc3f13e0e00e" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_img" DROP CONSTRAINT "FK_48d1af8311e010cfc3f13e0e00e"`)
    await queryRunner.query(`ALTER TABLE "room_equipment" DROP CONSTRAINT "FK_6c8e11c59351fefc6655dc35c1b"`)
    await queryRunner.query(`ALTER TABLE "room_equipment" DROP CONSTRAINT "FK_247edb0bcefa28936254ed577bd"`)
    await queryRunner.query(`ALTER TABLE "section_img" DROP CONSTRAINT "FK_9cf7fe5c96f747c2c11641c064b"`)
    await queryRunner.query(`ALTER TABLE "hotel_service" DROP CONSTRAINT "FK_c1cbe434b7211c54353f3445e7f"`)
    await queryRunner.query(`ALTER TABLE "hotel_service" DROP CONSTRAINT "FK_d3c8b9b4f285df3a0060c73fa76"`)
    await queryRunner.query(`ALTER TABLE "hotel_img" DROP CONSTRAINT "FK_b77c1637ca0f074309e73c79e4b"`)
    await queryRunner.query(`DROP TABLE "users"`)
    await queryRunner.query(`DROP TABLE "banner"`)
    await queryRunner.query(`DROP TABLE "contact-form"`)
    await queryRunner.query(`DROP TABLE "meta_data"`)
    await queryRunner.query(`DROP TABLE "room_img"`)
    await queryRunner.query(`DROP TABLE "room"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_e9677afbb554371b8c87c9e889"`)
    await queryRunner.query(`DROP TABLE "room_equipment"`)
    await queryRunner.query(`DROP TABLE "equipment"`)
    await queryRunner.query(`DROP TABLE "section"`)
    await queryRunner.query(`DROP TABLE "section_img"`)
    await queryRunner.query(`DROP TABLE "service"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_2b359d776af3c1e24b1e16f519"`)
    await queryRunner.query(`DROP TABLE "hotel_service"`)
    await queryRunner.query(`DROP TABLE "hotel"`)
    await queryRunner.query(`DROP TABLE "hotel_img"`)
  }
}
