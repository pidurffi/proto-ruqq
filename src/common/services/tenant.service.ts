import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITenantContext, ITenantService } from '../interfaces/tenant.interface';

@Injectable()
export class TenantService implements ITenantService {
  private currentTenant: ITenantContext | null = null;

  constructor(private readonly configService: ConfigService) {}

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
   */
  tenantToSchema(tenantId: string): string {
    if (tenantId === this.getDefaultTenant().tenantId) {
      return this.getDefaultTenant().schema;
    }
    
    return `tenant_${tenantId}`;
  }
}