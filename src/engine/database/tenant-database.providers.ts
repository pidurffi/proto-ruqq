import { resources } from './constants';
import { dataSourcePostgres } from '../../config/typeorm.config';

export const tenantDatabaseProviders = [
  // Nuevo provider para el servicio de multi-tenant
  {
    provide: 'TENANT_DATA_SOURCE_SERVICE',
    useFactory: (tenantService: any) => {
      // Inyectamos TenantService pero lo resolvemos dinámicamente para evitar dependencia circular
      const { TenantDataSourceService } = require('../../config/tenant-typeorm.config');
      return new TenantDataSourceService(tenantService);
    },
    inject: ['TenantService'], // Inyecta TenantService desde CommonModule
  },
];