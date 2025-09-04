import { Injectable, NestMiddleware, Logger, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';
import { ITenantContext } from '../interfaces/tenant.interface';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private readonly tenantService: TenantService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = Math.random().toString(36).substring(2, 8);
    const startTime = Date.now();
    
    try {
      let tenantId: string;
      let source: string;
      
      // Prioridad 1: Header X-Tenant-ID (enviado por nginx o directamente)
      const tenantHeader = req.headers['x-tenant-id'] as string;
      
      if (tenantHeader) {
        // Validar formato del header antes de usarlo
        const validation = this.tenantService.validateTenantId(tenantHeader);
        if (!validation.valid) {
          this.logger.error(`[${requestId}] Invalid X-Tenant-ID header format: '${tenantHeader}' - ${validation.error}`);
          throw new BadRequestException(`Invalid X-Tenant-ID header: ${validation.error}`);
        }
        
        tenantId = tenantHeader;
        source = 'X-Tenant-ID header';
        this.logger.log(`[${requestId}] Using tenant from X-Tenant-ID header: ${tenantId}`);
      } else {
        // Prioridad 2: Extraer del host/subdominio
        const host = req.get('host');
        tenantId = this.tenantService.extractTenantFromSubdomain(host || '');
        source = `host subdomain (${host})`;
        this.logger.log(`[${requestId}] Extracted tenant from host ${host}: ${tenantId}`);
      }
      
      // Crear contexto con validación
      let tenantContext: ITenantContext;
      
      try {
        // Si es el tenant por defecto, no validar existencia (siempre existe)
        if (tenantId === 'default' || tenantId === 'public') {
          tenantContext = this.tenantService.createTenantContext(tenantId);
          this.logger.debug(`[${requestId}] Using default tenant context without validation`);
        } else {
          // Para tenants específicos, validar existencia
          tenantContext = this.tenantService.createValidatedTenantContext(tenantId);
        }
      } catch (error) {
        // Registrar intento de acceso a tenant no válido
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`[${requestId}] Failed to create tenant context for '${tenantId}' from ${source}: ${errorMessage}`);
        this.logger.error(`[${requestId}] Valid tenants: ${this.tenantService.getValidTenants().join(', ')}`);
        
        // En lugar de lanzar error, usar tenant por defecto para debugging
        if (process.env.NODE_ENV === 'development') {
          this.logger.warn(`[${requestId}] Falling back to default tenant for development`);
          tenantContext = this.tenantService.getDefaultTenant();
        } else {
          throw error; // En producción, fallar
        }
      }
      
      // Establecer el contexto de tenant para esta request
      this.tenantService.setCurrentTenant(tenantContext);
      
      // Agregar información extendida del tenant a la request para debugging
      (req as any).tenant = {
        ...tenantContext,
        source,
        requestId,
        validatedAt: new Date().toISOString()
      };
      
      this.logger.log(`[${requestId}] ✅ Tenant context established: ${tenantContext.tenantId} (schema: ${tenantContext.schema}) from ${source}`);

      // Limpiar contexto al finalizar la request
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.logger.debug(`[${requestId}] Request completed in ${duration}ms, clearing tenant context`);
        this.tenantService.clearCurrentTenant();
      });

      next();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${requestId}] ❌ Tenant middleware error:`, errorMessage);
      
      // Agregar información de error para debugging
      (req as any).tenant = {
        error: errorMessage,
        requestId,
        failedAt: new Date().toISOString()
      };
      
      next(error); // Pasar error al siguiente handler
    }
  }
}