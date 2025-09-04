import { FactoryProvider, Inject } from '@nestjs/common';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { TenantDataSourceService } from '../../config/tenant-typeorm.config';

/**
 * Crea un factory provider para repositorios que soporte multi-tenancy
 * Mantiene backward compatibility con el patrón existente
 */
export function createTenantRepositoryProvider<T extends ObjectLiteral>(
  token: string,
  entity: EntityTarget<T>
): FactoryProvider {
  return {
    provide: token,
    useFactory: async (tenantDataSourceService: TenantDataSourceService): Promise<Repository<T>> => {
      // Obtener el DataSource del tenant actual
      const dataSource = await tenantDataSourceService.getCurrentDataSource();
      return dataSource.getRepository(entity);
    },
    inject: ['TENANT_DATA_SOURCE_SERVICE'],
  };
}

/**
 * Factory para providers que necesitan acceso directo al DataSource del tenant actual
 */
export function createTenantDataSourceProvider(): FactoryProvider {
  return {
    provide: 'TENANT_DATA_SOURCE',
    useFactory: async (tenantDataSourceService: TenantDataSourceService): Promise<DataSource> => {
      return await tenantDataSourceService.getCurrentDataSource();
    },
    inject: ['TENANT_DATA_SOURCE_SERVICE'],
  };
}

/**
 * Versión hybrid para mantener backward compatibility
 * Devuelve el DataSource tradicional como fallback si no hay tenant activo
 */
export function createHybridRepositoryProvider<T extends ObjectLiteral>(
  token: string,
  entity: EntityTarget<T>,
  fallbackDataSource: string = 'DATA_SOURCE_POSTGRES'
): FactoryProvider {
  return {
    provide: token,
    useFactory: async (
      tenantDataSourceService: TenantDataSourceService,
      fallbackDs: DataSource
    ): Promise<Repository<T>> => {
      try {
        // Intentar usar tenant-aware DataSource
        const tenantDataSource = await tenantDataSourceService.getCurrentDataSource();
        return tenantDataSource.getRepository(entity);
      } catch (error) {
        // Fallback al DataSource tradicional para backward compatibility
        console.warn(`Falling back to traditional DataSource for ${token}:`, error instanceof Error ? error.message : 'Unknown error');
        return fallbackDs.getRepository(entity);
      }
    },
    inject: ['TENANT_DATA_SOURCE_SERVICE', fallbackDataSource],
  };
}