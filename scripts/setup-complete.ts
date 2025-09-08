/**
 * Script Orquestador Completo - Setup de Ruqq
 * 
 * PROPÓSITO:
 * Orquesta la instalación completa del sistema Ruqq con máxima flexibilidad.
 * Permite instalar componentes individualmente o todos juntos.
 * 
 * FUNCIONALIDADES:
 * - Instalación modular de componentes
 * - Verificación de dependencias
 * - Manejo de errores y rollback
 * - Reportes detallados de instalación
 * 
 * USO:
 * npm run setup:complete                    # Instalación completa
 * npm run setup:complete -- --only=struct  # Solo estructura
 * npm run setup:complete -- --only=tenant  # Solo multi-tenant
 * npm run setup:complete -- --only=data    # Solo datos
 */

import { DataSource } from 'typeorm'
import { MultiTenantSystemSetup } from './setup-multitenant-system'
import { runSeeders } from '../src/engine/database/seeders'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import * as dotenv from 'dotenv'
import { join } from 'path'
import { spawn } from 'child_process'

// Cargar variables de entorno
const envPath = join(__dirname, '..', '.env')
dotenv.config({ path: envPath })

/**
 * Configuración de conexión para setup completo
 */
const completeSetupDataSource = new DataSource({
  type: 'postgres',
  host: String(process.env.PG_DB_HOST),
  port: parseInt(process.env.PG_DB_PORT || '5432'),
  username: String(process.env.PG_DB_USERNAME),
  password: String(process.env.PG_DB_PASSWORD),
  database: String(process.env.PG_DB_NAME),
  synchronize: false,
  logging: false,
  namingStrategy: new SnakeNamingStrategy(),
  entities: [
    join(__dirname, '..', 'src', '**', '*.entity{.ts,.js}')
  ],
})

/**
 * Interfaz para opciones de setup
 */
interface SetupOptions {
  only?: 'structure' | 'multitenant' | 'data' | 'all'
  force?: boolean
  skipMigrations?: boolean
  skipMultitenant?: boolean
  skipData?: boolean
}

/**
 * Clase orquestadora del setup completo
 */
class CompleteSetup {
  private options: SetupOptions

  constructor(options: SetupOptions = {}) {
    this.options = {
      only: 'all',
      force: false,
      skipMigrations: false,
      skipMultitenant: false,
      skipData: false,
      ...options
    }
  }

  /**
   * Ejecuta migraciones de estructura
   */
  private async runMigrations(): Promise<void> {
    if (this.options.skipMigrations || 
        (this.options.only && !['structure', 'all'].includes(this.options.only))) {
      console.log('⏭️ Saltando migraciones de estructura')
      return
    }

    console.log('🏗️ Ejecutando migraciones de estructura...')
    
    return new Promise((resolve, reject) => {
      const migrationProcess = spawn('npm', ['run', 'db:migrate'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: join(__dirname, '..')
      })

      let output = ''
      let errorOutput = ''

      migrationProcess.stdout.on('data', (data) => {
        output += data.toString()
        process.stdout.write(data)
      })

      migrationProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
        process.stderr.write(data)
      })

      migrationProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Migraciones de estructura completadas')
          resolve()
        } else {
          console.error('❌ Error en migraciones de estructura')
          reject(new Error(`Migration process exited with code ${code}`))
        }
      })
    })
  }

  /**
   * Instala el sistema multi-tenant
   */
  private async installMultiTenant(): Promise<void> {
    if (this.options.skipMultitenant || 
        (this.options.only && !['multitenant', 'all'].includes(this.options.only))) {
      console.log('⏭️ Saltando instalación multi-tenant')
      return
    }

    console.log('🏢 Instalando sistema multi-tenant...')
    
    const multiTenantSetup = new MultiTenantSystemSetup(completeSetupDataSource)
    
    if (this.options.force) {
      try {
        await multiTenantSetup.uninstall()
        console.log('🔄 Sistema multi-tenant reinstalado')
      } catch (error) {
        // Ignorar errores de desinstalación si no estaba instalado
      }
    }
    
    await multiTenantSetup.install()
  }

  /**
   * Ejecuta seeders de datos
   */
  private async runDataSeeders(): Promise<void> {
    if (this.options.skipData || 
        (this.options.only && !['data', 'all'].includes(this.options.only))) {
      console.log('⏭️ Saltando seeders de datos')
      return
    }

    console.log('🌱 Ejecutando seeders de datos...')
    await runSeeders(completeSetupDataSource)
  }

  /**
   * Genera reporte de instalación
   */
  private async generateInstallationReport(): Promise<void> {
    console.log('\n📋 REPORTE DE INSTALACIÓN:')
    console.log('╭─────────────────────────────────────────╮')
    console.log('│              RUQQ SETUP                 │')
    console.log('├─────────────────────────────────────────┤')

    try {
      // Verificar migraciones
      const migrations = await completeSetupDataSource.query(
        'SELECT name FROM migrations ORDER BY timestamp DESC LIMIT 3'
      )
      console.log('│ 🏗️ Migraciones:                         │')
      migrations.forEach((mig: any, index: number) => {
        const prefix = index === 0 ? '   └─ 📍' : '   ├─ 📄'
        console.log(`│ ${prefix} ${mig.name.substring(0, 25).padEnd(25)} │`)
      })
    } catch (error) {
      console.log('│ 🏗️ Migraciones: ❌ Error verificando    │')
    }

    try {
      // Verificar sistema multi-tenant
      const tenants = await completeSetupDataSource.query('SELECT * FROM list_tenants()')
      console.log('│ 🏢 Multi-tenant:                        │')
      console.log(`│    └─ 📊 ${tenants.length} tenants activos${' '.repeat(13)} │`)
      tenants.slice(0, 3).forEach((tenant: any) => {
        console.log(`│       ├─ 🏠 ${tenant.tenant_id.padEnd(20)} │`)
      })
    } catch (error) {
      console.log('│ 🏢 Multi-tenant: ❌ No instalado        │')
    }

    try {
      // Verificar datos iniciales
      const userCount = await completeSetupDataSource.query('SELECT COUNT(*) as count FROM users')
      console.log('│ 🌱 Datos iniciales:                     │')
      console.log(`│    └─ 👥 ${userCount[0].count} usuarios creados${' '.repeat(11)} │`)
    } catch (error) {
      console.log('│ 🌱 Datos iniciales: ❌ Error verificando│')
    }

    console.log('│                                         │')
    console.log('│ 🎯 COMANDOS DISPONIBLES:                │')
    console.log('│    npm run setup:multitenant            │')
    console.log('│    npm run setup:data                   │')
    console.log('│    npm run db:migrate                   │')
    console.log('│    npm run start:dev                    │')
    console.log('╰─────────────────────────────────────────╯')
  }

  /**
   * Ejecuta el setup completo
   */
  async run(): Promise<void> {
    console.log('🚀 Setup Completo de Ruqq - Versión Modular')
    console.log(`📊 Modo: ${this.options.only === 'all' ? 'Instalación completa' : `Solo ${this.options.only}`}`)
    console.log('📊 Conectando a base de datos...\n')

    try {
      await completeSetupDataSource.initialize()
      console.log('✅ Conexión establecida\n')

      // Ejecutar componentes según opciones
      await this.runMigrations()
      console.log('')

      await this.installMultiTenant()
      console.log('')

      await this.runDataSeeders()
      console.log('')

      // Generar reporte final
      await this.generateInstallationReport()

      console.log('\n🎉 Setup completado exitosamente!')
      console.log('💡 Tu aplicación Ruqq está lista para desarrollo')

    } catch (error) {
      console.error('\n💥 Error durante el setup:', error)
      console.error('\n🔍 Posibles soluciones:')
      console.error('  • Verificar conexión a base de datos')
      console.error('  • Ejecutar componentes individualmente')
      console.error('  • Usar --force para reinstalar')
      throw error
    }
  }
}

/**
 * Función principal del script
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  
  // Parsear argumentos
  const options: SetupOptions = {}
  
  args.forEach(arg => {
    if (arg.startsWith('--only=')) {
      options.only = arg.split('=')[1] as any
    }
    if (arg === '--force') {
      options.force = true
    }
    if (arg === '--skip-migrations') {
      options.skipMigrations = true
    }
    if (arg === '--skip-multitenant') {
      options.skipMultitenant = true
    }
    if (arg === '--skip-data') {
      options.skipData = true
    }
  })

  const setup = new CompleteSetup(options)

  try {
    await setup.run()
  } catch (error) {
    process.exit(1)
  } finally {
    if (completeSetupDataSource.isInitialized) {
      await completeSetupDataSource.destroy()
      console.log('\n🔌 Conexión cerrada')
    }
  }
}

// Ejecutar script si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
}

// Exportar para uso programático
export { CompleteSetup }