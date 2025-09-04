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
}
