import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';
import { ITenantContext } from '../interfaces/tenant.interface';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  use(req: Request, res: Response, next: NextFunction) {
    let tenantId: string;
    
    // Prioridad 1: Header X-Tenant-ID (enviado por nginx o directamente)
    const tenantHeader = req.headers['x-tenant-id'] as string;
    
    if (tenantHeader) {
      // Usar directamente el valor del header
      tenantId = tenantHeader;
      console.log(`[TenantMiddleware] Using tenant from X-Tenant-ID header: ${tenantId}`);
    } else {
      // Prioridad 2: Extraer del host/subdominio
      const host = req.get('host');
      tenantId = this.tenantService.extractTenantFromSubdomain(host || '');
      console.log(`[TenantMiddleware] Extracted tenant from host ${host}: ${tenantId}`);
    }
    
    const schema = this.tenantService.tenantToSchema(tenantId);
    
    const tenantContext: ITenantContext = {
      tenantId,
      schema,
    };
    
    // Establecer el contexto de tenant para esta request
    this.tenantService.setCurrentTenant(tenantContext);
    
    // Agregar información del tenant a la request para debugging
    (req as any).tenant = tenantContext;
    
    console.log(`[TenantMiddleware] Set tenant context:`, tenantContext);

    // Limpiar contexto al finalizar la request
    res.on('finish', () => {
      this.tenantService.clearCurrentTenant();
    });

    next();
  }
}