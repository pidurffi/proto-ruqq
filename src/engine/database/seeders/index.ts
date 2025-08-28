/**
 * Seeder principal para Ruqq - Versión inicial
 * 
 * PROPÓSITO:
 * Orquesta la ejecución de seeders de forma ordenada y controlada.
 * Actualmente solo maneja el SuperAdmin, pero está preparado para crecer.
 * 
 * ARQUITECTURA ESCALABLE:
 * - Cada seeder es independiente y reutilizable
 * - Orden de ejecución controlado por dependencias
 * - Manejo de errores centralizado
 * - Feedback visual del progreso
 * 
 * ROADMAP FUTURO:
 * 1. SuperAdmin ✅ (actual)
 * 2. Roles básicos del sistema
 * 3. Configuraciones iniciales
 * 4. Datos de prueba para hoteles
 * 5. Tarifas y habitaciones de ejemplo
 */

import { DataSource } from 'typeorm'
import { SuperAdminSeeder } from './super-admin.seeder'

/**
 * Clase principal que orquesta todos los seeders
 * 
 * RESPONSABILIDADES:
 * - Controlar orden de ejecución
 * - Manejar dependencias entre seeders
 * - Proporcionar feedback visual
 * - Gestionar errores de forma centralizada
 * 
 * PATRONES APLICADOS:
 * - Dependency Injection: DataSource inyectado
 * - Chain of Responsibility: Seeders ejecutados en cadena
 * - Error Handling: Captura y propagación de errores
 */
export class MainSeeder {
  constructor(private dataSource: DataSource) {}

  /**
   * Ejecuta todos los seeders en orden correcto
   * 
   * ORDEN ACTUAL:
   * 1. SuperAdmin (único usuario del sistema)
   * 
   * ORDEN FUTURO PLANIFICADO:
   * 1. SuperAdmin ✅
   * 2. Roles del sistema
   * 3. Configuraciones base
   * 4. Hoteles de ejemplo
   * 5. Habitaciones de ejemplo
   * 6. Tarifas de ejemplo
   * 
   * @throws Error si algún seeder falla
   */
  async run(): Promise<void> {
    console.log('🌱 Iniciando seeders de Ruqq...\n')

    try {
      // 1. SuperAdmin (usuario del sistema)
      // DEBE ser primero: es el único usuario con acceso completo
      console.log('1️⃣ Creando SuperAdmin...')
      const superAdminSeeder = new SuperAdminSeeder(this.dataSource)
      await superAdminSeeder.run()

      // TODO: Agregar más seeders aquí conforme el sistema crezca
      // 
      // console.log('2️⃣ Creando roles del sistema...')
      // const rolesSeeder = new RolesSeeder(this.dataSource)
      // await rolesSeeder.run()
      //
      // console.log('3️⃣ Creando configuraciones base...')
      // const configSeeder = new ConfigSeeder(this.dataSource)
      // await configSeeder.run()

      console.log('✅ Todos los seeders completados exitosamente!')
      console.log('📊 Base de datos lista para desarrollo\n')

    } catch (error) {
      console.error('❌ Error ejecutando seeders:', error)
      console.error('💡 Tip: Verificar conexión a base de datos y estructura de entidades')
      throw error
    }
  }
}

/**
 * Función de conveniencia para ejecutar seeders desde scripts externos
 * 
 * USO PREVISTO:
 * - Scripts de desarrollo (npm run db:seed)
 * - Inicialización de tests
 * - Scripts de deployment
 * - Comandos de CLI personalizados
 * 
 * @param dataSource Conexión TypeORM inicializada
 * @example
 * ```typescript
 * import { DataSource } from 'typeorm'
 * import { runSeeders } from './seeders'
 * 
 * const dataSource = new DataSource(ormConfig)
 * await dataSource.initialize()
 * await runSeeders(dataSource)
 * await dataSource.destroy()
 * ```
 */
export async function runSeeders(dataSource: DataSource): Promise<void> {
  const mainSeeder = new MainSeeder(dataSource)
  await mainSeeder.run()
}