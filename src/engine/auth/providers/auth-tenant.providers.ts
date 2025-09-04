import { DataSource } from 'typeorm'

import { User } from '../entities/user.entity'
import { resources } from '../../database/constants'
import { repositories } from '../constants'
import { TenantService } from '../../../common/services/tenant.service'

/**
 * Crea un repositorio tenant-aware que cambia de schema dinámicamente
 */
function createTenantAwareRepository(dataSource: DataSource, tenantService: TenantService) {
  return new Proxy(dataSource.getRepository(User), {
    get(target, prop, receiver) {
      // Interceptar métodos de consulta para cambiar schema dinámicamente
      if (typeof (target as any)[prop] === 'function' && 
          ['find', 'findOne', 'findBy', 'findOneBy', 'save', 'create', 'update', 'delete', 'remove', 'createQueryBuilder', 'preload'].includes(prop as string)) {
        
        return function(...args: any[]) {
          const tenantContext = tenantService.getActiveTenant()
          console.log(`[AuthTenantProvider] Executing ${String(prop)} on schema: ${tenantContext.schema}`)
          
          // Para schema public, usar comportamiento por defecto
          if (tenantContext.schema === 'public') {
            return (target as any)[prop].apply(target, args)
          }
          
          // Para createQueryBuilder, cambiar el schema
          if (prop === 'createQueryBuilder') {
            const queryBuilder = (target as any).createQueryBuilder.apply(target, args)
            queryBuilder.from(`${tenantContext.schema}.users`, args[0] || 'user')
            return queryBuilder
          }
          
          // Para otros métodos, ejecutar en transacción con schema específico
          return dataSource.transaction(async manager => {
            await manager.query(`SET search_path TO "${tenantContext.schema}", public`)
            const repoWithSchema = manager.getRepository(User)
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

/**
 * Provider tenant-aware para User
 */
export const AuthTenantProviders = [
  {
    provide: repositories.AUTH_REPOSITORY,
    useFactory: (tenantService: TenantService, dataSource: DataSource) => {
      console.log(`[AuthTenantProvider] Creating repository for schema: ${tenantService.getActiveTenant().schema}`)
      return createTenantAwareRepository(dataSource, tenantService)
    },
    inject: [TenantService, resources.DATA_SOURCE_POSTGRES],
  },
]