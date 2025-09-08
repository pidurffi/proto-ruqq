/**
 * Script de Setup del Sistema Multi-Tenant - Ruqq
 * 
 * PROPÓSITO:
 * Instala y configura el sistema multi-tenant con funciones PostgreSQL.
 * Este script es independiente de las migraciones para mayor flexibilidad.
 * 
 * FUNCIONALIDADES:
 * - Creación de tabla tenant_creation_log
 * - Instalación de funciones PostgreSQL para gestión de tenants
 * - Creación del tenant 'default' (arquitectura base)
 * - Verificación de estado del sistema
 * 
 * USO:
 * - Desarrollo: npm run setup:multitenant
 * - Producción: Ejecutar solo si se requiere multi-tenancy
 * - Testing: Instalación modular de componentes
 */

import { DataSource } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import * as dotenv from 'dotenv'
import { join } from 'path'

// Cargar variables de entorno
const envPath = join(__dirname, '..', '.env')
dotenv.config({ path: envPath })

/**
 * Configuración de conexión para setup multi-tenant
 */
const setupDataSource = new DataSource({
  type: 'postgres',
  host: String(process.env.PG_DB_HOST),
  port: parseInt(process.env.PG_DB_PORT || '5432'),
  username: String(process.env.PG_DB_USERNAME),
  password: String(process.env.PG_DB_PASSWORD),
  database: String(process.env.PG_DB_NAME),
  synchronize: false,
  logging: false,
  namingStrategy: new SnakeNamingStrategy(),
  entities: [], // No necesitamos entidades para este script
})

/**
 * Clase principal para instalación del sistema multi-tenant
 */
class MultiTenantSystemSetup {
  constructor(private dataSource: DataSource) {}

  /**
   * Verifica si el sistema multi-tenant ya está instalado
   */
  private async isSystemInstalled(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1 FROM tenant_creation_log LIMIT 1')
      await this.dataSource.query('SELECT list_tenants()')
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Crea la tabla de control de tenants
   */
  private async createTenantControlTable(): Promise<void> {
    console.log('   📋 Creando tabla de control de tenants...')
    
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS tenant_creation_log (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL UNIQUE,
        schema_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT
      );
    `)
    
    console.log('   ✅ Tabla tenant_creation_log creada')
  }

  /**
   * Instala las funciones PostgreSQL para gestión de tenants
   */
  private async installPostgreSQLFunctions(): Promise<void> {
    console.log('   ⚙️ Instalando funciones PostgreSQL...')

    // Función para clonar estructura de schema
    await this.dataSource.query(`
      CREATE OR REPLACE FUNCTION clone_schema_structure(source_schema text, target_schema text)
      RETURNS void AS $$
      DECLARE
          object_name text;
          buffer text;
          seq_name text;
          constraint_name text;
          index_name text;
      BEGIN
          -- Crear el schema si no existe
          EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || target_schema;
          
          -- Copiar todas las tablas con su estructura completa
          FOR object_name IN
              SELECT table_name::text
              FROM information_schema.tables 
              WHERE table_schema = source_schema
              AND table_type = 'BASE TABLE'
              AND table_name != 'tenant_creation_log'  -- Excluir tabla de tenants
              AND table_name != 'migrations'           -- Excluir migraciones
          LOOP
              buffer := target_schema || '.' || object_name;
              EXECUTE 'CREATE TABLE IF NOT EXISTS ' || buffer || ' (LIKE ' || source_schema || '.' || object_name || ' INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES)';
              
              -- Recrear secuencias asociadas
              FOR seq_name IN
                  SELECT sequence_name
                  FROM information_schema.sequences
                  WHERE sequence_schema = source_schema
                  AND sequence_name LIKE '%' || object_name || '%'
              LOOP
                  EXECUTE 'CREATE SEQUENCE IF NOT EXISTS ' || target_schema || '.' || seq_name;
                  -- Asociar la secuencia con la tabla si es necesario
                  BEGIN
                      EXECUTE 'ALTER SEQUENCE ' || target_schema || '.' || seq_name || 
                             ' OWNED BY ' || buffer || '.id';
                  EXCEPTION WHEN OTHERS THEN
                      -- Ignorar errores si no existe columna id
                      NULL;
                  END;
              END LOOP;
          END LOOP;
          
          -- Copiar vistas
          FOR object_name IN
              SELECT table_name::text
              FROM information_schema.tables 
              WHERE table_schema = source_schema
              AND table_type = 'VIEW'
          LOOP
              SELECT view_definition INTO buffer
              FROM information_schema.views
              WHERE table_schema = source_schema
              AND table_name = object_name;
              
              -- Reemplazar referencias al schema original
              buffer := REPLACE(buffer, source_schema || '.', target_schema || '.');
              
              EXECUTE 'CREATE OR REPLACE VIEW ' || target_schema || '.' || object_name || ' AS ' || buffer;
          END LOOP;
          
          RAISE NOTICE 'Schema % clonado exitosamente desde %', target_schema, source_schema;
      END;
      $$ LANGUAGE plpgsql;
    `)

    console.log('   ✅ Función clone_schema_structure instalada')

    // Función para crear tenant dinámicamente
    await this.dataSource.query(`
      CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_id text)
      RETURNS void AS $$
      DECLARE
          schema_name text;
          tenant_exists boolean;
      BEGIN
          -- Validar que el tenant_id sea válido
          IF tenant_id !~ '^[a-zA-Z0-9_-]+$' THEN
              RAISE EXCEPTION 'Tenant ID inválido: %. Solo se permiten letras, números, guiones y guiones bajos.', tenant_id;
          END IF;
          
          -- Generar nombre del schema
          schema_name := CASE 
              WHEN tenant_id = 'default' THEN 'public'
              ELSE tenant_id
          END;
          
          -- Verificar si ya existe
          SELECT EXISTS(
              SELECT 1 FROM tenant_creation_log WHERE tenant_creation_log.tenant_id = create_tenant_schema.tenant_id
          ) INTO tenant_exists;
          
          IF tenant_exists THEN
              RAISE NOTICE 'El tenant % ya existe', tenant_id;
              RETURN;
          END IF;
          
          -- Solo crear schema si no es 'default' (que usa 'public')
          IF schema_name != 'public' THEN
              -- Crear el schema del tenant clonando desde public
              PERFORM clone_schema_structure('public', schema_name);
          END IF;
          
          -- Registrar el tenant
          INSERT INTO tenant_creation_log (tenant_id, schema_name, status, notes) 
          VALUES (tenant_id, schema_name, 'active', 'Creado por setup multi-tenant');
          
          RAISE NOTICE 'Tenant % creado exitosamente con schema %', tenant_id, schema_name;
      EXCEPTION
          WHEN duplicate_schema THEN
              RAISE NOTICE 'El schema % ya existe', schema_name;
          WHEN OTHERS THEN
              RAISE EXCEPTION 'Error creando tenant %: %', tenant_id, SQLERRM;
      END;
      $$ LANGUAGE plpgsql;
    `)

    console.log('   ✅ Función create_tenant_schema instalada')

    // Función para listar tenants
    await this.dataSource.query(`
      CREATE OR REPLACE FUNCTION list_tenants()
      RETURNS TABLE(tenant_id text, schema_name text, status text, created_at timestamp) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              tcl.tenant_id::text,
              tcl.schema_name::text,
              tcl.status::text,
              tcl.created_at
          FROM tenant_creation_log tcl
          ORDER BY tcl.created_at DESC;
      END;
      $$ LANGUAGE plpgsql;
    `)

    console.log('   ✅ Función list_tenants instalada')

    // Función para eliminar tenant
    await this.dataSource.query(`
      CREATE OR REPLACE FUNCTION delete_tenant_schema(tenant_id text, hard_delete boolean DEFAULT false)
      RETURNS void AS $$
      DECLARE
          schema_name text;
      BEGIN
          -- Obtener el schema name
          SELECT tcl.schema_name INTO schema_name
          FROM tenant_creation_log tcl
          WHERE tcl.tenant_id = delete_tenant_schema.tenant_id;
          
          IF schema_name IS NULL THEN
              RAISE EXCEPTION 'Tenant % no encontrado', tenant_id;
          END IF;
          
          IF schema_name = 'public' THEN
              RAISE EXCEPTION 'No se puede eliminar el tenant default (schema public)';
          END IF;
          
          IF hard_delete THEN
              -- Eliminación física del schema
              EXECUTE 'DROP SCHEMA IF EXISTS ' || schema_name || ' CASCADE';
              DELETE FROM tenant_creation_log WHERE tenant_creation_log.tenant_id = delete_tenant_schema.tenant_id;
              RAISE NOTICE 'Tenant % eliminado físicamente', tenant_id;
          ELSE
              -- Soft delete
              UPDATE tenant_creation_log 
              SET status = 'deleted', updated_at = NOW()
              WHERE tenant_creation_log.tenant_id = delete_tenant_schema.tenant_id;
              RAISE NOTICE 'Tenant % marcado como eliminado (soft delete)', tenant_id;
          END IF;
      END;
      $$ LANGUAGE plpgsql;
    `)

    console.log('   ✅ Función delete_tenant_schema instalada')
    console.log('   🎯 Todas las funciones PostgreSQL instaladas correctamente')
  }

  /**
   * Crea el tenant 'default' (parte de la arquitectura base)
   */
  private async createDefaultTenant(): Promise<void> {
    console.log('   🏠 Creando tenant default (arquitectura base)...')
    
    try {
      await this.dataSource.query(`SELECT create_tenant_schema('default')`)
      console.log('   ✅ Tenant default configurado (usa schema public)')
    } catch (error) {
      console.log('   ℹ️ Tenant default ya existe o se creó anteriormente')
    }
  }

  /**
   * Ejecuta la instalación completa del sistema multi-tenant
   */
  async install(): Promise<void> {
    console.log('🏢 Instalando Sistema Multi-Tenant de Ruqq...\n')

    // Verificar si ya está instalado
    const isInstalled = await this.isSystemInstalled()
    if (isInstalled) {
      console.log('ℹ️ Sistema multi-tenant ya está instalado')
      console.log('💡 Usa "npm run setup:multitenant --force" para reinstalar')
      return
    }

    try {
      // Paso 1: Crear tabla de control
      await this.createTenantControlTable()

      // Paso 2: Instalar funciones PostgreSQL
      await this.installPostgreSQLFunctions()

      // Paso 3: Crear tenant default
      await this.createDefaultTenant()

      console.log('\n✅ Sistema Multi-Tenant instalado exitosamente!')
      console.log('📊 Funcionalidades disponibles:')
      console.log('   • Gestión dinámica de tenants')
      console.log('   • Clonación automática de schemas')
      console.log('   • Aislamiento total de datos por tenant')
      console.log('   • Tenant default configurado')
      console.log('\n💡 Próximos pasos:')
      console.log('   • npm run setup:data        # Crear datos iniciales')
      console.log('   • npm run setup:complete    # Instalación completa')

    } catch (error) {
      console.error('❌ Error instalando sistema multi-tenant:', error)
      throw error
    }
  }

  /**
   * Desinstala el sistema multi-tenant (solo desarrollo/testing)
   */
  async uninstall(): Promise<void> {
    console.log('🗑️ Desinstalando Sistema Multi-Tenant...\n')

    try {
      // Eliminar funciones
      await this.dataSource.query(`DROP FUNCTION IF EXISTS delete_tenant_schema(text, boolean)`)
      await this.dataSource.query(`DROP FUNCTION IF EXISTS list_tenants()`)
      await this.dataSource.query(`DROP FUNCTION IF EXISTS create_tenant_schema(text)`)
      await this.dataSource.query(`DROP FUNCTION IF EXISTS clone_schema_structure(text, text)`)

      // Eliminar tabla de control
      await this.dataSource.query(`DROP TABLE IF EXISTS tenant_creation_log`)

      console.log('✅ Sistema multi-tenant desinstalado correctamente')
      console.log('⚠️ Los schemas de tenants NO se eliminaron (seguridad)')
      
    } catch (error) {
      console.error('❌ Error desinstalando sistema multi-tenant:', error)
      throw error
    }
  }
}

/**
 * Función principal del script
 */
async function main(): Promise<void> {
  const forceReinstall = process.argv.includes('--force')
  const uninstall = process.argv.includes('--uninstall')
  
  console.log('🚀 Setup del Sistema Multi-Tenant - Ruqq')
  console.log('📊 Conectando a base de datos...\n')

  try {
    await setupDataSource.initialize()
    console.log('✅ Conexión establecida\n')

    const setup = new MultiTenantSystemSetup(setupDataSource)

    if (uninstall) {
      await setup.uninstall()
    } else {
      if (forceReinstall) {
        await setup.uninstall()
        console.log('\n🔄 Reinstalando sistema...\n')
      }
      await setup.install()
    }

  } catch (error) {
    console.error('💥 Error durante el setup:', error)
    process.exit(1)
  } finally {
    if (setupDataSource.isInitialized) {
      await setupDataSource.destroy()
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
export { MultiTenantSystemSetup }