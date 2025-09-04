-- Script de configuración inicial para Multi-Tenancy con PostgreSQL Schemas
-- Ejecutar como superusuario de PostgreSQL

-- 1. Crear esquemas de ejemplo para tenants
CREATE SCHEMA IF NOT EXISTS tenant_cliente1;
CREATE SCHEMA IF NOT EXISTS tenant_hotel_abc;
CREATE SCHEMA IF NOT EXISTS tenant_demo;

-- 2. Comentarios para documentación
COMMENT ON SCHEMA tenant_cliente1 IS 'Esquema para tenant cliente1.tudominio.com';
COMMENT ON SCHEMA tenant_hotel_abc IS 'Esquema para tenant hotel-abc.midominio.com';
COMMENT ON SCHEMA tenant_demo IS 'Esquema de demostración para pruebas';

-- 3. Crear función para clonar estructura del schema public a un tenant
CREATE OR REPLACE FUNCTION clone_schema_structure(source_schema text, target_schema text)
RETURNS void AS $$
DECLARE
    object_name text;
    buffer text;
    seq_name text;
BEGIN
    -- Crear el schema si no existe
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || target_schema;
    
    -- Copiar todas las tablas con su estructura
    FOR object_name IN
        SELECT table_name::text
        FROM information_schema.tables 
        WHERE table_schema = source_schema
        AND table_type = 'BASE TABLE'
    LOOP
        buffer := target_schema || '.' || object_name;
        EXECUTE 'CREATE TABLE IF NOT EXISTS ' || buffer || ' (LIKE ' || source_schema || '.' || object_name || ' INCLUDING ALL)';
        
        -- Copiar secuencias si existen
        FOR seq_name IN
            SELECT sequence_name
            FROM information_schema.sequences
            WHERE sequence_schema = source_schema
            AND sequence_name LIKE object_name || '%'
        LOOP
            EXECUTE 'CREATE SEQUENCE IF NOT EXISTS ' || target_schema || '.' || seq_name || 
                   ' OWNED BY ' || buffer || '.id';
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
        
        EXECUTE 'CREATE OR REPLACE VIEW ' || target_schema || '.' || object_name || ' AS ' || buffer;
    END LOOP;
    
    RAISE NOTICE 'Schema % clonado exitosamente desde %', target_schema, source_schema;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para crear un nuevo tenant dinámicamente
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_id text)
RETURNS void AS $$
BEGIN
    -- Validar que el tenant_id sea válido (solo letras, números, guiones bajos)
    IF tenant_id !~ '^[a-zA-Z0-9_]+$' THEN
        RAISE EXCEPTION 'Tenant ID inválido: %. Solo se permiten letras, números y guiones bajos.', tenant_id;
    END IF;
    
    -- Crear el schema del tenant clonando desde public
    PERFORM clone_schema_structure('public', tenant_id);
    
    -- Log del evento
    INSERT INTO public.tenant_creation_log (tenant_id, created_at) 
    VALUES (tenant_id, NOW());
    
    RAISE NOTICE 'Tenant % creado exitosamente', tenant_id;
EXCEPTION
    WHEN duplicate_schema THEN
        RAISE NOTICE 'El schema % ya existe', tenant_id;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creando tenant %: %', tenant_id, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear tabla de log para creación de tenants (en public)
CREATE TABLE IF NOT EXISTS public.tenant_creation_log (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- 6. Crear los tenants de ejemplo
SELECT create_tenant_schema('tenant_cliente1');
SELECT create_tenant_schema('tenant_hotel_abc');  
SELECT create_tenant_schema('tenant_demo');

-- 7. Otorgar permisos básicos al usuario de la aplicación
-- NOTA: Reemplazar 'app_user' con el usuario real de tu aplicación
-- GRANT ALL PRIVILEGES ON SCHEMA tenant_cliente1 TO app_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tenant_cliente1 TO app_user;
-- GRANT ALL PRIVILEGES ON SCHEMA tenant_hotel_abc TO app_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tenant_hotel_abc TO app_user;
-- GRANT ALL PRIVILEGES ON SCHEMA tenant_demo TO app_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tenant_demo TO app_user;

-- 8. Configurar search_path por defecto (opcional)
-- ALTER USER app_user SET search_path = public, tenant_cliente1, tenant_hotel_abc;

COMMIT;