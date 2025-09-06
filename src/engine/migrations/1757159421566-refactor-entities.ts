import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorEntities1757159421566 implements MigrationInterface {
    name = 'RefactorEntities1757159421566'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restrictions" ADD CONSTRAINT "FK_745adf2a599e954d51726d12631" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restrictions" DROP CONSTRAINT "FK_745adf2a599e954d51726d12631"`);
    }

}
