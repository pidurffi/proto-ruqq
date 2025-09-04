import { Controller, Get, Req } from '@nestjs/common'
import { Request } from 'express'
import { ApiOperation } from '@nestjs/swagger'

import { AppService } from './app.service'
import { TenantService } from './common/services/tenant.service'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly tenantService: TenantService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('tenant-info')
  @ApiOperation({ summary: 'Get current tenant information' })
  getTenantInfo(@Req() req: Request): any {
    const currentTenant = this.tenantService.getActiveTenant()
    const requestTenant = (req as any).tenant
    
    return {
      message: 'Multi-tenant system is working!',
      currentTenant,
      requestTenant,
      headers: {
        'x-tenant-id': req.headers['x-tenant-id'],
        'host': req.headers['host'],
      },
      extractedFromHost: this.tenantService.extractTenantFromSubdomain(req.get('host') || ''),
    }
  }

  // ========================================
  // GESTIÓN DE TENANTS
  // ========================================
  // NOTA: Endpoints temporalmente deshabilitados hasta resolver dependencias circulares
  // Los endpoints de gestión de tenants se implementarán en un módulo dedicado

  // ========================================
  // TESTING TENANT REPOSITORIES
  // ========================================
  @Get('test-tenant-repo')
  @ApiOperation({ summary: 'Test tenant-aware repository (temporary endpoint for testing)' })
  async testTenantRepository(@Req() req: Request): Promise<any> {
    const currentTenant = this.tenantService.getActiveTenant()
    const requestTenant = (req as any).tenant
    
    return {
      message: 'Testing tenant-aware repository functionality',
      currentTenant,
      requestTenant,
      note: 'This endpoint tests the tenant repository context without database queries',
      timestamp: new Date().toISOString()
    }
  }

  @Get('tenant-debug')
  @ApiOperation({ summary: 'Debug tenant system - show validation and available tenants' })
  getTenantDebug(@Req() req: Request): any {
    const tenantHeader = req.headers['x-tenant-id'] as string;
    const host = req.get('host');
    const currentTenant = this.tenantService.getActiveTenant();
    const requestTenant = (req as any).tenant;
    
    let headerValidation = null;
    if (tenantHeader) {
      headerValidation = this.tenantService.validateAndCheckTenant(tenantHeader);
    }
    
    const extractedFromHost = this.tenantService.extractTenantFromSubdomain(host || '');
    let hostValidation = null;
    if (extractedFromHost && extractedFromHost !== 'default') {
      hostValidation = this.tenantService.validateAndCheckTenant(extractedFromHost);
    }
    
    return {
      message: 'Tenant system debugging information',
      timestamp: new Date().toISOString(),
      
      // Request info
      request: {
        tenantHeader,
        host,
        extractedFromHost,
        currentTenant,
        requestTenant,
      },
      
      // Validations
      validation: {
        header: headerValidation,
        host: hostValidation,
      },
      
      // System info
      system: {
        validTenants: this.tenantService.getValidTenants(),
        defaultTenant: this.tenantService.getDefaultTenant(),
        environment: process.env.NODE_ENV || 'development',
      },
      
      // Troubleshooting
      troubleshooting: {
        'Use X-Tenant-ID header': 'curl -H "X-Tenant-ID: cliente1" http://localhost:3001/api/tenant-debug',
        'Available tenant IDs': this.tenantService.getValidTenants(),
        'Schema mapping examples': {
          'cliente1': this.tenantService.tenantToSchema('cliente1'),
          'tenant_cliente2': this.tenantService.tenantToSchema('tenant_cliente2'),
          'default': this.tenantService.tenantToSchema('default'),
        }
      }
    }
  }
}
