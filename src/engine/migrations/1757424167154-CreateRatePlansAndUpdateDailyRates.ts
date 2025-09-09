import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateRatePlansAndUpdateDailyRates1757424167154 implements MigrationInterface {
  name = 'CreateRatePlansAndUpdateDailyRates1757424167154'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla rate_plans
    await queryRunner.query(`
      CREATE TABLE "rate_plans" (
        "id" varchar PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
        "uid" varchar NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "code" varchar(20) NOT NULL,
        "description" text,
        "is_refundable" boolean NOT NULL DEFAULT true,
        "advance_purchase_days" integer,
        "included_services" varchar(100),
        "parent_rate_plan_id" varchar,
        "parent_adjustment_percent" numeric(5,2),
        "default_min_stay" integer,
        "default_max_stay" integer,
        "cancellation_deadline_hours" integer,
        "cancellation_penalty_type" varchar(20),
        "cancellation_penalty_value" numeric(10,2),
        "is_active" boolean NOT NULL DEFAULT true,
        "display_order" integer NOT NULL DEFAULT 0,
        "booking_engine_code" varchar(50),
        "created_by_source" varchar(50),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      )
    `)

    // 2. Crear índices para rate_plans
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_rate_plans_code" ON "rate_plans" ("code") WHERE deleted_at IS NULL`)
    await queryRunner.query(`CREATE INDEX "idx_rate_plans_active" ON "rate_plans" ("is_active")`)
    await queryRunner.query(`CREATE INDEX "idx_rate_plans_parent" ON "rate_plans" ("parent_rate_plan_id")`)

    // 3. Crear foreign key para self-reference
    await queryRunner.query(`ALTER TABLE "rate_plans" ADD CONSTRAINT "FK_rate_plans_parent" FOREIGN KEY ("parent_rate_plan_id") REFERENCES "rate_plans"("id") ON DELETE SET NULL`)

    // 4. Crear rate plan por defecto "BAR" (Best Available Rate)
    await queryRunner.query(`
      INSERT INTO "rate_plans" (name, code, description, is_refundable, display_order, created_by_source) 
      VALUES ('Best Available Rate', 'BAR', 'Tarifa base estándar con cancelación flexible', true, 1, 'migration_default')
    `)

    // 5. Obtener el ID del rate plan BAR para usarlo como default
    await queryRunner.query(`
      DO $$
      DECLARE 
        bar_rate_plan_id varchar;
      BEGIN
        SELECT id INTO bar_rate_plan_id FROM rate_plans WHERE code = 'BAR' LIMIT 1;

        -- 6. Agregar columna rate_plan_id a daily_room_rates
        ALTER TABLE "daily_room_rates" ADD COLUMN "rate_plan_id" varchar;

        -- 7. Actualizar registros existentes para usar el rate plan BAR por defecto
        EXECUTE 'UPDATE "daily_room_rates" SET "rate_plan_id" = ''' || bar_rate_plan_id || ''' WHERE "rate_plan_id" IS NULL';

        -- 8. Hacer la columna NOT NULL después de poblarla
        ALTER TABLE "daily_room_rates" ALTER COLUMN "rate_plan_id" SET NOT NULL;

        -- 9. Eliminar el índice único anterior
        DROP INDEX IF EXISTS "idx_daily_rates_main";

        -- 10. Crear nuevo índice único compuesto incluyendo rate_plan_id
        CREATE UNIQUE INDEX "idx_daily_rates_main" ON "daily_room_rates" ("room_type_id", "rate_plan_id", "date");

        -- 11. Crear índice para rate_plan_id
        CREATE INDEX "idx_daily_rates_rate_plan" ON "daily_room_rates" ("rate_plan_id");

        -- 12. Crear foreign key hacia rate_plans
        ALTER TABLE "daily_room_rates" ADD CONSTRAINT "FK_daily_room_rates_rate_plan" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plans"("id") ON DELETE CASCADE;

      END $$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar foreign key de daily_room_rates hacia rate_plans
    await queryRunner.query(`ALTER TABLE "daily_room_rates" DROP CONSTRAINT "FK_daily_room_rates_rate_plan"`)

    // 2. Eliminar índices de daily_room_rates
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_daily_rates_rate_plan"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_daily_rates_main"`)

    // 3. Recrear índice único original (sin rate_plan_id)
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_daily_rates_main" ON "daily_room_rates" ("room_type_id", "date")`)

    // 4. Eliminar columna rate_plan_id de daily_room_rates
    await queryRunner.query(`ALTER TABLE "daily_room_rates" DROP COLUMN "rate_plan_id"`)

    // 5. Eliminar foreign key self-reference de rate_plans
    await queryRunner.query(`ALTER TABLE "rate_plans" DROP CONSTRAINT "FK_rate_plans_parent"`)

    // 6. Eliminar índices de rate_plans
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_rate_plans_parent"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_rate_plans_active"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_rate_plans_code"`)

    // 7. Eliminar tabla rate_plans
    await queryRunner.query(`DROP TABLE "rate_plans"`)
  }
}
