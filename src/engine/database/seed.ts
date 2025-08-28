/**
 * Script runner para ejecutar seeders de Ruqq
 * 
 * PROPÓSITO:
 * Script principal que inicializa la conexión a base de datos
 * y ejecuta todos los seeders de forma segura.
 * 
 * FUNCIONALIDADES:
 * - Inicialización de DataSource TypeORM
 * - Ejecución de seeders en orden correcto
 * - Manejo de errores y cleanup
 * - Feedback visual del proceso
 * 
 * USO:
 * - Desarrollo: npm run db:seed
 * - Testing: importar y ejecutar programáticamente
 * - CI/CD: script de inicialización de ambiente
 */

import { DataSource } from 'typeorm'
import { runSeeders } from './seeders'
import { User } from '../auth/entities/user.entity'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import * as dotenv from 'dotenv'
import { join } from 'path'

// Cargar variables de entorno desde .env usando la misma lógica que ormconfig.ts
const envPath = join(__dirname, '../../..', '.env')
dotenv.config({ path: envPath })

/**
 * Configuración de conexión para seeders
 * 
 * NOTA: Utiliza variables de entorno del sistema
 * Asegúrate de que estén configuradas correctamente:
 * - PG_DB_HOST
 * - PG_DB_PORT  
 * - PG_DB_USERNAME
 * - PG_DB_PASSWORD
 * - PG_DB_NAME
 */
const seedDataSource = new DataSource({
  type: 'postgres',
  host: String(process.env.PG_DB_HOST),
  port: parseInt(process.env.PG_DB_PORT || '5432'),
  username: String(process.env.PG_DB_USERNAME),
  password: String(process.env.PG_DB_PASSWORD),
  database: String(process.env.PG_DB_NAME),
  synchronize: false, // IMPORTANTE: false para usar migraciones
  logging: false, // Reducir ruido durante seeding
  namingStrategy: new SnakeNamingStrategy(), // Misma estrategia que el proyecto
  entities: [
    User,
    // TODO: Agregar más entidades aquí según el sistema crezca
  ],
})

/**
 * Función principal que ejecuta todo el proceso de seeding
 * 
 * PROCESO:
 * 1. Conecta a la base de datos
 * 2. Ejecuta todos los seeders
 * 3. Cierra conexión limpiamente
 * 4. Maneja errores y cleanup
 * 
 * @throws Error si falla la conexión o algún seeder
 */
async function main(): Promise<void> {
  console.log('🚀 Iniciando proceso de seeding para Ruqq')
  console.log('📊 Conectando a base de datos...\n')

  try {
    // Inicializar conexión a base de datos
    await seedDataSource.initialize()
    console.log('✅ Conexión a base de datos establecida\n')

    // Ejecutar todos los seeders
    await runSeeders(seedDataSource)

    console.log('🎉 Proceso de seeding completado exitosamente')
    console.log('💡 Tu aplicación está lista para usar\n')

  } catch (error) {
    console.error('💥 Error durante el seeding:')
    console.error(error)
    console.error('\n🔍 Posibles causas:')
    console.error('  - Base de datos no accesible')
    console.error('  - Variables de entorno incorrectas')
    console.error('  - Migraciones no ejecutadas')
    console.error('  - Estructura de entidades incorrecta\n')
    
    process.exit(1)
  } finally {
    // Cleanup: cerrar conexión siempre
    if (seedDataSource.isInitialized) {
      await seedDataSource.destroy()
      console.log('🔌 Conexión a base de datos cerrada')
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