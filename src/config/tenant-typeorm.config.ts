import { DataSource, DataSourceOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Injectable } from '@nestjs/common';
import { config } from './ormconfig';
import { TenantService } from '../common/services/tenant.service';

@Injectable()
export class TenantDataSourceService {
  private dataSources = new Map<string, DataSource>();
  private readonly baseConfig: PostgresConnectionOptions;

  constructor(private readonly tenantService: TenantService) {
    // Usar la configuración base existente
    const [postgresConfig] = config;
    this.baseConfig = postgresConfig as PostgresConnectionOptions;
    
    // Inicializar con el esquema por defecto
    this.initializeDefaultDataSource();
  }

  /**
   * Inicializa el DataSource por defecto (backward compatibility)
   */
  private async initializeDefaultDataSource(): Promise<void> {
    const defaultTenant = this.tenantService.getDefaultTenant();
    const dataSource = new DataSource({
      ...this.baseConfig,
      schema: defaultTenant.schema,
    } as PostgresConnectionOptions);

    await dataSource.initialize();
    this.dataSources.set(defaultTenant.schema, dataSource);
  }

  /**
   * Obtiene el DataSource para el tenant actual
   * Si no existe, lo crea dinámicamente
   */
  async getDataSource(schema?: string): Promise<DataSource> {
    const targetSchema = schema || this.tenantService.getActiveTenant().schema;
    
    // Si ya existe, devolverlo
    if (this.dataSources.has(targetSchema)) {
      return this.dataSources.get(targetSchema)!;
    }

    // Crear nuevo DataSource para el schema
    const dataSource = new DataSource({
      ...this.baseConfig,
      schema: targetSchema,
      name: `connection_${targetSchema}`, // Nombre único para cada conexión
    } as PostgresConnectionOptions);

    await dataSource.initialize();
    this.dataSources.set(targetSchema, dataSource);
    
    return dataSource;
  }

  /**
   * Obtiene el DataSource del tenant actual automáticamente
   */
  async getCurrentDataSource(): Promise<DataSource> {
    const currentTenant = this.tenantService.getActiveTenant();
    return this.getDataSource(currentTenant.schema);
  }

  /**
   * Cierra todas las conexiones (para testing o shutdown)
   */
  async closeAllConnections(): Promise<void> {
    const promises = Array.from(this.dataSources.values()).map(ds => 
      ds.isInitialized ? ds.destroy() : Promise.resolve()
    );
    
    await Promise.all(promises);
    this.dataSources.clear();
  }

  /**
   * Verifica si un schema existe en la base de datos
   */
  async schemaExists(schema: string): Promise<boolean> {
    try {
      const defaultDs = await this.getDataSource('public');
      const result = await defaultDs.query(
        'SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1',
        [schema]
      );
      return result.length > 0;
    } catch (error) {
      console.error(`Error checking schema existence for ${schema}:`, error);
      return false;
    }
  }

  /**
   * Crea un nuevo schema si no existe
   */
  async createSchemaIfNotExists(schema: string): Promise<void> {
    const exists = await this.schemaExists(schema);
    if (!exists) {
      const defaultDs = await this.getDataSource('public');
      await defaultDs.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    }
  }
}