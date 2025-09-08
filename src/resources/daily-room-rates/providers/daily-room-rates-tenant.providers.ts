import { DataSource } from 'typeorm'
import { DailyRoomRate } from '../entities/daily-room-rate.entity'
import { TenantService } from '../../../common/services/tenant.service'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

/**
 * DailyRoomRatesTenantProvider - Provider multi-tenant para modelo OTA
 * 
 * IMPLEMENTA EL PATRÓN TENANT-AWARE PARA MODELO DIARIO:
 * - Cada hotel (tenant) tiene sus propias tarifas diarias aisladas
 * - Compatible con arquitectura multi-schema de PostgreSQL
 * - Intercepta operaciones CRUD para aplicar contexto de tenant
 * 
 * MÉTODOS INTERCEPTADOS:
 * - find, findOne, findBy, findOneBy (consultas)
 * - save, create, update, delete, remove (escritura)
 * - createQueryBuilder (queries personalizadas)
 * - preload (para relaciones)
 */
function createTenantAwareRepository(dataSource: DataSource, tenantService: TenantService) {
  return new Proxy(dataSource.getRepository(DailyRoomRate), {
    get(target, prop, receiver) {
      if (typeof (target as any)[prop] === 'function' && 
          ['find', 'findOne', 'findBy', 'findOneBy', 'save', 'create', 'update', 'delete', 'remove', 'createQueryBuilder', 'preload'].includes(prop as string)) {
        
        return function(...args: any[]) {
          const tenantContext = tenantService.getActiveTenant()
          console.log(`[DailyRoomRatesTenantProvider] Executing ${String(prop)} on schema: ${tenantContext.schema}`)
          
          // Schema public = comportamiento por defecto (desarrollo)
          if (tenantContext.schema === 'public') {
            return (target as any)[prop].apply(target, args)
          }
          
          // QueryBuilder requiere manejo especial para cambiar schema
          if (prop === 'createQueryBuilder') {
            const queryBuilder = (target as any).createQueryBuilder.apply(target, args)
            // Cambiar la tabla base del query al schema correcto
            queryBuilder.from(`${tenantContext.schema}.daily_room_rates`, args[0] || 'dailyRoomRate')
            return queryBuilder
          }
          
          // Otros schemas = transacción con SET search_path
          return dataSource.transaction(async manager => {
            await manager.query(`SET search_path TO "${tenantContext.schema}", public`)
            const repoWithSchema = manager.getRepository(DailyRoomRate)
            const result = await (repoWithSchema as any)[prop].apply(repoWithSchema, args)
            await manager.query(`SET search_path TO public`)
            return result
          })
        }
      }
      return Reflect.get(target, prop, receiver)
    }
  })
}

export const DailyRoomRatesTenantProviders = [
  {
    provide: repositories.DAILY_ROOM_RATES_REPOSITORY,
    useFactory: (tenantService: TenantService, dataSource: DataSource) => {
      console.log(`[DailyRoomRatesTenantProvider] Creating repository for schema: ${tenantService.getActiveTenant().schema}`)
      return createTenantAwareRepository(dataSource, tenantService)
    },
    inject: [TenantService, resources.DATA_SOURCE_POSTGRES],
  },
]