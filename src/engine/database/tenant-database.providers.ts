import { resources } from './constants';
import { dataSourcePostgres } from '../../config/typeorm.config';
import { TenantDataSourceService } from '../../config/tenant-typeorm.config';

export const tenantDatabaseProviders = [
  // Mantener el provider original para backward compatibility
  {
    provide: resources.DATA_SOURCE_POSTGRES,
    useFactory: async () => {
      return dataSourcePostgres.initialize();
    },
  },
  // Nuevo provider para multi-tenant
  {
    provide: 'TENANT_DATA_SOURCE_SERVICE',
    useClass: TenantDataSourceService,
  },
  // Provider que devuelve el DataSource según el contexto del tenant actual
  {
    provide: 'CURRENT_DATA_SOURCE',
    useFactory: async (tenantService: TenantDataSourceService) => {
      // Este factory se ejecutará cada vez que se inyecte
      return () => tenantService.getCurrentDataSource();
    },
    inject: ['TENANT_DATA_SOURCE_SERVICE'],
  },
];