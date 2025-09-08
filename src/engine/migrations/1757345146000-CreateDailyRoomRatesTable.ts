import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateDailyRoomRatesTable1757345146000 implements MigrationInterface {
  name = 'CreateDailyRoomRatesTable1757345146000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla daily_room_rates con modelo OTA estándar
    await queryRunner.query(`
      CREATE TABLE "daily_room_rates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "uid" uuid NOT NULL,
        "room_type_id" uuid NOT NULL,
        "date" date NOT NULL,
        "base_rate" decimal(10,2) NOT NULL,
        "single_occupancy_rate" decimal(10,2),
        "extra_person_rate" decimal(10,2),
        "available_rooms" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "min_stay" integer,
        "max_stay" integer,
        "closed_to_arrival" boolean NOT NULL DEFAULT false,
        "closed_to_departure" boolean NOT NULL DEFAULT false,
        "last_updated_by" uuid,
        "pricing_source" character varying(50),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_daily_room_rates" PRIMARY KEY ("id")
      )
    `)

    // Crear índice único para clave compuesta (room_type_id, date) - Como OTAs
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_daily_rates_main" 
      ON "daily_room_rates" ("room_type_id", "date") 
      WHERE "deleted_at" IS NULL
    `)

    // Crear índice para consultas por rango de fechas
    await queryRunner.query(`
      CREATE INDEX "idx_daily_rates_date_active" 
      ON "daily_room_rates" ("date", "is_active") 
      WHERE "deleted_at" IS NULL
    `)

    // Crear índice para consultas de disponibilidad
    await queryRunner.query(`
      CREATE INDEX "idx_daily_rates_availability" 
      ON "daily_room_rates" ("room_type_id", "date", "available_rooms") 
      WHERE "deleted_at" IS NULL AND "available_rooms" > 0
    `)

    // Crear foreign key a room_type
    await queryRunner.query(`
      ALTER TABLE "daily_room_rates" 
      ADD CONSTRAINT "FK_daily_room_rates_room_type" 
      FOREIGN KEY ("room_type_id") 
      REFERENCES "room_type"("id") 
      ON DELETE RESTRICT ON UPDATE CASCADE
    `)

    // Agregar comentarios para documentación
    await queryRunner.query(`
      COMMENT ON TABLE "daily_room_rates" IS 'Modelo OTA estándar - Un registro por día como Booking.com, Airbnb, Expedia. Reemplaza: base_rate_period + price_rules + occupancy_rate_modifiers + restrictions'
    `)
    
    await queryRunner.query(`
      COMMENT ON COLUMN "daily_room_rates"."date" IS 'UN REGISTRO POR CADA DÍA - Estándar OTA. Clave compuesta con room_type_id'
    `)
    
    await queryRunner.query(`
      COMMENT ON COLUMN "daily_room_rates"."base_rate" IS 'Precio base para capacidad estándar. Equivale a XML Booking.com: <roomrate price="35.00" />'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.query(`ALTER TABLE "daily_room_rates" DROP CONSTRAINT "FK_daily_room_rates_room_type"`)
    
    // Eliminar índices
    await queryRunner.query(`DROP INDEX "idx_daily_rates_availability"`)
    await queryRunner.query(`DROP INDEX "idx_daily_rates_date_active"`)
    await queryRunner.query(`DROP INDEX "idx_daily_rates_main"`)
    
    // Eliminar tabla
    await queryRunner.query(`DROP TABLE "daily_room_rates"`)
  }
}
