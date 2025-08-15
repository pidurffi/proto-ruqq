import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1755203422052 implements MigrationInterface {
    name = 'Test1755203422052'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "test" ADD "name" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "test" DROP COLUMN "name"`);
    }

}
