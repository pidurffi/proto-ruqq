import { MigrationInterface, QueryRunner } from "typeorm";

export class Popup1722865418242 implements MigrationInterface {
    name = 'Popup1722865418242'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "popup" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uid" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL DEFAULT 'popup', "enabled" boolean NOT NULL, "title" character varying(255) NOT NULL, "text" character varying(255) NOT NULL, "img_path" text NOT NULL, "img_thumb_path" text NOT NULL, CONSTRAINT "PK_cdae257395a57b3508d324d63e3" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "popup"`);
    }

}
