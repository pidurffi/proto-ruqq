import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { tenantStorage } from '../context/tenant-context';
import { ITenantContext, ITenantService } from '../interfaces/tenant.interface';

export interface ITenantListItem {
  tenant_id: string;
  schema_name: string;
  status: string;
  created_at: Date;
}

@Injectable()
export class TenantService implements ITenantService {
  private readonly logger = new Logger(TenantService.name);

  // Lista de tenants válidos - en producción esto vendría de BD
  private readonly validTenants = new Set([
    'default',
    'public', 
    'tenant_cliente1',
    'tenant_cliente2', 
    'tenant_hotel_abc',
    'tenant_demo',
    'cliente1',
    'cliente2'
  ]);

  constructor(
    private readonly configService: ConfigService,
  ) {}

  /**
   * Tenant de la request en curso.
   *
   * Se lee de AsyncLocalStorage, no de un campo de instancia: este servicio es
   * un singleton y un campo compartido haría que las requests concurrentes se
   * pisen el contexto entre sí. Ver src/common/context/tenant-context.ts.
   *
   * Devuelve null fuera de una request (seeders, scripts, tareas programadas).
   */
  getCurrentTenant(): ITenantContext | null {
    return tenantStorage.getStore() ?? null;
  }

  /**
   * Ejecuta `callback` con `context` como tenant activo, aislado del resto de
   * las requests en vuelo.
   *
   * No requiere limpieza posterior: el scope se libera cuando la cadena
   * asincrónica del callback termina.
   */
  runWithTenant<T>(context: ITenantContext, callback: () => T): T {
    return tenantStorage.run(context, callback);
  }

  getDefaultTenant(): ITenantContext {
    const defaultTenantId = this.configService.get<string>('DEFAULT_TENANT_ID', 'default');
    const defaultSchema = this.configService.get<string>('DEFAULT_SCHEMA', 'public');
    
    return {
      tenantId: defaultTenantId,
      schema: defaultSchema,
    };
  }

  /**
   * Obtiene el tenant actual o el por defecto si no hay uno establecido
   */
  getActiveTenant(): ITenantContext {
    return this.getCurrentTenant() || this.getDefaultTenant();
  }

  /**
   * Extrae el tenant ID de un subdominio
   * Ejemplo: cliente1.tudominio.com -> cliente1
   */
  extractTenantFromSubdomain(host: string): string {
    if (!host) return this.getDefaultTenant().tenantId;
    
    const parts = host.split('.');
    if (parts.length < 2) return this.getDefaultTenant().tenantId;
    
    const subdomain = parts[0];
    // Validar que el subdominio no sea 'www' o esté vacío
    if (!subdomain || subdomain === 'www') {
      return this.getDefaultTenant().tenantId;
    }
    
    return subdomain;
  }

  /**
   * Convierte un tenant ID en nombre de schema
   * Ejemplo: cliente1 -> tenant_cliente1
   * Si ya tiene prefijo tenant_, lo usa directamente
   */
  tenantToSchema(tenantId: string): string {
    if (tenantId === this.getDefaultTenant().tenantId) {
      return this.getDefaultTenant().schema;
    }
    
    // Si ya tiene el prefijo tenant_, usarlo directamente
    if (tenantId.startsWith('tenant_')) {
      return tenantId;
    }
    
    // Si no tiene prefijo, agregarlo
    return `tenant_${tenantId}`;
  }

  // ========================================
  // GESTIÓN DE TENANTS (Funciones de BD)
  // ========================================
  // NOTA: Implementación temporal deshabilitada hasta resolver dependencias circulares

  /**
   * Crear un contexto de tenant válido desde un tenant ID
   */
  createTenantContext(tenantId: string): ITenantContext {
    const schema = this.tenantToSchema(tenantId);
    return {
      tenantId,
      schema,
    };
  }

  /**
   * Validar que un tenant ID sea válido (formato)
   */
  validateTenantId(tenantId: string): { valid: boolean; error?: string } {
    // Regex que coincide con la función de PostgreSQL
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    
    if (!tenantId || tenantId.trim() === '') {
      return { valid: false, error: 'Tenant ID no puede estar vacío' };
    }

    if (!validPattern.test(tenantId)) {
      return { valid: false, error: 'Tenant ID solo puede contener letras, números, guiones y guiones bajos' };
    }

    if (tenantId.length > 50) {
      return { valid: false, error: 'Tenant ID no puede exceder 50 caracteres' };
    }

    return { valid: true };
  }

  /**
   * Validar que un tenant exista en el sistema
   */
  tenantExists(tenantId: string): boolean {
    const schema = this.tenantToSchema(tenantId);
    const exists = this.validTenants.has(tenantId) || this.validTenants.has(schema);
    
    this.logger.debug(`[tenantExists] Checking tenant: ${tenantId} (schema: ${schema}) = ${exists}`);
    
    return exists;
  }

  /**
   * Validar tenant ID con verificación de existencia
   */
  validateAndCheckTenant(tenantId: string): { valid: boolean; error?: string; exists?: boolean } {
    // Primero validar formato
    const formatValidation = this.validateTenantId(tenantId);
    if (!formatValidation.valid) {
      this.logger.warn(`[validateAndCheckTenant] Invalid format for tenant: ${tenantId} - ${formatValidation.error}`);
      return formatValidation;
    }

    // Luego verificar existencia
    const exists = this.tenantExists(tenantId);
    if (!exists) {
      const error = `Tenant '${tenantId}' no existe en el sistema`;
      this.logger.warn(`[validateAndCheckTenant] ${error}`);
      return { valid: false, error, exists: false };
    }

    this.logger.debug(`[validateAndCheckTenant] Tenant ${tenantId} is valid and exists`);
    return { valid: true, exists: true };
  }

  /**
   * Crear contexto de tenant con validación
   */
  createValidatedTenantContext(tenantId: string): ITenantContext {
    const validation = this.validateAndCheckTenant(tenantId);
    
    if (!validation.valid) {
      this.logger.error(`[createValidatedTenantContext] Failed to create context for tenant: ${tenantId} - ${validation.error}`);
      throw new BadRequestException(validation.error);
    }

    const schema = this.tenantToSchema(tenantId);
    const context: ITenantContext = { tenantId, schema };
    
    this.logger.log(`[createValidatedTenantContext] Created valid context for tenant: ${tenantId} (schema: ${schema})`);
    
    return context;
  }

  /**
   * Obtener lista de tenants válidos (para debugging)
   */
  getValidTenants(): string[] {
    return Array.from(this.validTenants);
  }
}