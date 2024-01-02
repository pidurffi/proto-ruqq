import { MigrationInterface, QueryRunner } from 'typeorm'

export class Template implements MigrationInterface {
  name = 'Template'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(``)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(``)
  }
}
