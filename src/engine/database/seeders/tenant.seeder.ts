/**
 * Seeder para Tenants - Sistema Multi-Tenant de Ruqq
 *
 * PROPÓSITO:
 * Crea tenants iniciales de ejemplo y demo para desarrollo.
 * Utiliza las funciones PostgreSQL creadas por la migración.
 *
 * FUNCIONAMIENTO:
 * 1. Verifica qué tenants ya existen
 * 2. Crea tenants de ejemplo si no existen
 * 3. Proporciona feedback visual del proceso
 * 4. Es idempotente (puede ejecutarse múltiples veces)
 *
 * TENANTS CREADOS:
 * - tenant_cliente1: Hotel ejemplo 1
 * - tenant_cliente2: Hotel ejemplo 2
 * - tenant_demo: Datos de demostración
 *
 * DEPENDENCIAS:
 * - Migración CreateMultiTenantSystem debe estar ejecutada
 * - Funciones PostgreSQL disponibles: create_tenant_schema, list_tenants
 *
 * ORDEN DE EJECUCIÓN: 2° (después de SuperAdmin)
 */

import { DataSource } from 'typeorm'

export class TenantSeeder {
  constructor(private dataSource: DataSource) {}

  /**
   * Lista los tenants existentes usando la función PostgreSQL
   * 
   * @returns Promise<string[]> Array de tenant IDs existentes
   */
  private async getExistingTenants(): Promise<string[]> {
    const result = await this.dataSource.query('SELECT * FROM list_tenants()')
    return result.map((row: any) => row.tenant_id)
  }

  /**
   * Crea un tenant usando la función PostgreSQL si no existe
   * 
   * @param tenantId ID del tenant a crear
   * @param description Descripción para logging
   */
  private async createTenantIfNotExists(tenantId: string, description: string): Promise<void> {
    const existingTenants = await this.getExistingTenants()
    
    if (existingTenants.includes(tenantId)) {
      console.log(`   ✅ Tenant '${tenantId}' ya existe (${description})`)
      return
    }

    try {
      await this.dataSource.query('SELECT create_tenant_schema($1)', [tenantId])
      console.log(`   ✅ Tenant '${tenantId}' creado exitosamente (${description})`)
    } catch (error) {
      console.error(`   ❌ Error creando tenant '${tenantId}':`, error)
      throw error
    }
  }

  /**
   * Ejecuta la creación de tenants iniciales de desarrollo
   * 
   * TENANTS CREADOS:
   * 1. tenant_cliente1 - Hotel ejemplo para desarrollo
   * 2. tenant_cliente2 - Segundo hotel ejemplo
   * 3. tenant_demo - Datos de demostración y testing
   * 
   * NOTA: El tenant 'default' ya se crea en la migración
   */
  async run(): Promise<void> {
    console.log('   🏢 Configurando tenants de desarrollo...\n')

    try {
      // Mostrar tenants existentes antes de crear
      const existingTenants = await this.getExistingTenants()
      console.log(`   📊 Tenants existentes: ${existingTenants.length}`)
      if (existingTenants.length > 0) {
        existingTenants.forEach(tenantId => {
          console.log(`   📍 ${tenantId}`)
        })
        console.log('')
      }

      // Crear tenants de desarrollo
      await this.createTenantIfNotExists(
        'tenant_cliente1', 
        'Hotel Cliente Demo 1'
      )

      await this.createTenantIfNotExists(
        'tenant_cliente2', 
        'Hotel Cliente Demo 2'
      )

      await this.createTenantIfNotExists(
        'tenant_demo', 
        'Datos de Demostración'
      )

      // Mostrar resumen final
      console.log('')
      const finalTenants = await this.getExistingTenants()
      console.log(`   ✅ Total de tenants disponibles: ${finalTenants.length}`)
      
      console.log('\n📋 TENANTS DISPONIBLES PARA DESARROLLO:')
      console.log('   ╭─────────────────────────────────────╮')
      console.log('   │           TENANTS ACTIVOS           │')
      console.log('   ├─────────────────────────────────────┤')
      
      finalTenants.forEach(tenantId => {
        console.log(`   │ ${tenantId.padEnd(35)} │`)
      })
      
      console.log('   │                                     │')
      console.log('   │ 🔄 Header: X-Tenant-ID: cliente1   │')
      console.log('   │ 🔄 Header: X-Tenant-ID: cliente2   │')
      console.log('   │ 🔄 Sin header = tenant por defecto │')
      console.log('   ╰─────────────────────────────────────╯')
      console.log('')

    } catch (error) {
      console.error('❌ Error configurando tenants:', error)
      console.error('💡 Tip: Verificar que la migración CreateMultiTenantSystem esté ejecutada')
      throw error
    }
  }
}