import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';
import { ITenantContext } from '../interfaces/tenant.interface';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Extraer tenant del header X-Tenant-ID (enviado por nginx)
    const tenantHost = req.headers['x-tenant-id'] as string || req.get('host');
    
    if (tenantHost) {
      // Extraer tenant ID del subdominio
      const tenantId = this.tenantService.extractTenantFromSubdomain(tenantHost);
      const schema = this.tenantService.tenantToSchema(tenantId);
      
      const tenantContext: ITenantContext = {
        tenantId,
        schema,
      };
      
      // Establecer el contexto de tenant para esta request
      this.tenantService.setCurrentTenant(tenantContext);
      
      // Agregar información del tenant a la request para debugging
      (req as any).tenant = tenantContext;
    } else {
      // Sin header, usar tenant por defecto
      const defaultTenant = this.tenantService.getDefaultTenant();
      this.tenantService.setCurrentTenant(defaultTenant);
      (req as any).tenant = defaultTenant;
    }

    // Limpiar contexto al finalizar la request
    res.on('finish', () => {
      this.tenantService.clearCurrentTenant();
    });

    next();
  }
}