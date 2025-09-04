import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateMultiTenantSystem1756996231172 implements MigrationInterface {
  name = 'CreateMultiTenantSystem1756996231172'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla de log para tenants en el schema public
    await queryRunner.query(`
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

    // 2. Crear función para clonar estructura de schema
    await queryRunner.query(`
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

    // 3. Crear función para crear un nuevo tenant dinámicamente
    await queryRunner.query(`
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
          VALUES (tenant_id, schema_name, 'active', 'Creado automáticamente por migración');
          
          RAISE NOTICE 'Tenant % creado exitosamente con schema %', tenant_id, schema_name;
      EXCEPTION
          WHEN duplicate_schema THEN
              RAISE NOTICE 'El schema % ya existe', schema_name;
          WHEN OTHERS THEN
              RAISE EXCEPTION 'Error creando tenant %: %', tenant_id, SQLERRM;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // 4. Función para listar todos los tenants
    await queryRunner.query(`
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

    // 5. Función para eliminar un tenant (soft delete)
    await queryRunner.query(`
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

    // 6. Crear tenants iniciales de ejemplo
    await queryRunner.query(`SELECT create_tenant_schema('default')`)
    await queryRunner.query(`SELECT create_tenant_schema('tenant_cliente1')`)
    await queryRunner.query(`SELECT create_tenant_schema('tenant_hotel_abc')`)
    await queryRunner.query(`SELECT create_tenant_schema('tenant_demo')`)

    console.log('✅ Multi-tenant system created successfully!')
    console.log('   - Created tenant management functions')
    console.log('   - Created tenant_creation_log table')
    console.log('   - Created 4 initial tenants: default, tenant_cliente1, tenant_hotel_abc, tenant_demo')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tenants creados (excepto default)
    await queryRunner.query(`SELECT delete_tenant_schema('tenant_cliente1', true)`)
    await queryRunner.query(`SELECT delete_tenant_schema('tenant_hotel_abc', true)`)
    await queryRunner.query(`SELECT delete_tenant_schema('tenant_demo', true)`)

    // Eliminar funciones
    await queryRunner.query(`DROP FUNCTION IF EXISTS delete_tenant_schema(text, boolean)`)
    await queryRunner.query(`DROP FUNCTION IF EXISTS list_tenants()`)
    await queryRunner.query(`DROP FUNCTION IF EXISTS create_tenant_schema(text)`)
    await queryRunner.query(`DROP FUNCTION IF EXISTS clone_schema_structure(text, text)`)

    // Eliminar tabla de log
    await queryRunner.query(`DROP TABLE IF EXISTS tenant_creation_log`)

    console.log('❌ Multi-tenant system removed successfully!')
  }
}
