import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITenantContext, ITenantService } from '../interfaces/tenant.interface';

export interface ITenantListItem {
  tenant_id: string;
  schema_name: string;
  status: string;
  created_at: Date;
}

@Injectable()
export class TenantService implements ITenantService {
  private currentTenant: ITenantContext | null = null;

  constructor(
    private readonly configService: ConfigService,
  ) {}

  getCurrentTenant(): ITenantContext | null {
    return this.currentTenant;
  }

  setCurrentTenant(context: ITenantContext): void {
    this.currentTenant = context;
  }

  clearCurrentTenant(): void {
    this.currentTenant = null;
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
   * Validar que un tenant ID sea válido (para crear nuevos tenants)
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
}