/**
 * Seeder principal para Ruqq - Sistema Completo de Datos Iniciales
 * 
 * PROPÓSITO:
 * Orquesta la ejecución de seeders para crear un hotel completamente funcional.
 * Incluye usuarios, tenants, room types y tarifas diarias hasta 30/04/2026.
 * 
 * ARQUITECTURA ESCALABLE:
 * - Cada seeder es independiente y reutilizable
 * - Orden de ejecución controlado por dependencias
 * - Manejo de errores centralizado
 * - Feedback visual del progreso
 * 
 * DATOS CREADOS:
 * 1. SuperAdmin ✅ (usuario administrador)
 * 2. Tenants ✅ (esquemas multi-tenant)
 * 3. Initial Data ✅ (room types + tarifas diarias completas)
 * 
 * ROADMAP FUTURO:
 * 4. Roles del sistema
 * 5. Configuraciones iniciales
 * 6. Datos de ejemplo por tenant
 */

import { DataSource } from 'typeorm'
import { SuperAdminSeeder } from './super-admin.seeder'
import { TenantSeeder } from './tenant.seeder'
import { InitialDataSeeder } from './initial-data.seeder'

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
   * 2. Tenants (esquemas multi-tenant de desarrollo)
   * 3. Initial Data (room types + tarifas diarias completas)
   * 
   * ORDEN FUTURO PLANIFICADO:
   * 1. SuperAdmin ✅
   * 2. Tenants ✅
   * 3. Initial Data ✅ (room types + tarifas hasta 30/04/2026)
   * 4. Roles del sistema
   * 5. Configuraciones base
   * 6. Datos de ejemplo por tenant
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

      // 2. Tenants (esquemas multi-tenant)
      // DEBE ser segundo: crea los esquemas de desarrollo para hoteles
      console.log('2️⃣ Configurando tenants multi-tenant...')
      const tenantSeeder = new TenantSeeder(this.dataSource)
      await tenantSeeder.run()

      // 3. Initial Data (room types + tarifas diarias)
      // DEBE ser tercero: crea room types y todas las tarifas hasta 30/04/2026
      console.log('3️⃣ Creando datos iniciales del hotel...')
      const initialDataSeeder = new InitialDataSeeder(this.dataSource)
      await initialDataSeeder.run()

      // TODO: Agregar más seeders aquí conforme el sistema crezca
      // 
      // console.log('4️⃣ Creando roles del sistema...')
      // const rolesSeeder = new RolesSeeder(this.dataSource)
      // await rolesSeeder.run()
      //
      // console.log('5️⃣ Creando configuraciones base...')
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