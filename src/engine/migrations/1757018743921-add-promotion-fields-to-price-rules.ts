import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPromotionFieldsToPriceRules1757018743921 implements MigrationInterface {
  name = 'AddPromotionFieldsToPriceRules1757018743921'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "price_rules" 
      ADD COLUMN "promotion_name" varchar NULL,
      ADD COLUMN "promotion_description" varchar NULL
    `)

    // Agregar comentarios a las columnas
    await queryRunner.query(`
      COMMENT ON COLUMN "price_rules"."promotion_name" IS 'Nombre de la promoción (opcional, para diferenciación semántica en frontend)'
    `)
    
    await queryRunner.query(`
      COMMENT ON COLUMN "price_rules"."promotion_description" IS 'Descripción de la promoción (opcional, para contexto adicional)'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "price_rules" 
      DROP COLUMN "promotion_description",
      DROP COLUMN "promotion_name"
    `)
  }
}
