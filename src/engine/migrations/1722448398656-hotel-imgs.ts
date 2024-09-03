import { MigrationInterface, QueryRunner } from "typeorm";

export class HotelImgs1722448398656 implements MigrationInterface {
    name = 'HotelImgs1722448398656'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hotel_img" DROP COLUMN "file_path"`);
        await queryRunner.query(`ALTER TABLE "hotel_img" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "hotel_img" ADD "img_path" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "hotel_img" ADD "img_thumb_path" character varying(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hotel_img" DROP COLUMN "img_thumb_path"`);
        await queryRunner.query(`ALTER TABLE "hotel_img" DROP COLUMN "img_path"`);
        await queryRunner.query(`ALTER TABLE "hotel_img" ADD "description" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "hotel_img" ADD "file_path" character varying(255) NOT NULL`);
    }

}
