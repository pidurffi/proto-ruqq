import { DataSource } from 'typeorm'

import { ContentBlock } from '../entities/content-block.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'
import { TenantService } from '../../../common/services/tenant.service'

/**
 * Crea un repositorio tenant-aware que cambia de schema dinámicamente
 */
function createTenantAwareRepository(dataSource: DataSource, tenantService: TenantService) {
  return new Proxy(dataSource.getRepository(ContentBlock), {
    get(target, prop, receiver) {
      // Interceptar métodos de consulta para cambiar schema dinámicamente
      if (typeof (target as any)[prop] === 'function' && 
          ['find', 'findOne', 'findBy', 'findOneBy', 'save', 'create', 'update', 'delete', 'remove', 'createQueryBuilder', 'preload'].includes(prop as string)) {
        
        return function(...args: any[]) {
          const tenantContext = tenantService.getActiveTenant()
          console.log(`[ContentBlockTenantProvider] Executing ${String(prop)} on schema: ${tenantContext.schema}`)
          
          // Para schema public, usar comportamiento por defecto
          if (tenantContext.schema === 'public') {
            return (target as any)[prop].apply(target, args)
          }
          
          // Para createQueryBuilder, cambiar el schema
          if (prop === 'createQueryBuilder') {
            const queryBuilder = (target as any).createQueryBuilder.apply(target, args)
            queryBuilder.from(`${tenantContext.schema}.content_block`, args[0] || 'contentBlock')
            return queryBuilder
          }
          
          // Para otros métodos, ejecutar en transacción con schema específico
          return dataSource.transaction(async manager => {
            await manager.query(`SET search_path TO "${tenantContext.schema}", public`)
            const repoWithSchema = manager.getRepository(ContentBlock)
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
 * Provider tenant-aware para ContentBlock
 */
export const ContentBlockTenantProviders = [
  {
    provide: repositories.CONTENT_BLOCK_REPOSITORY,
    useFactory: (tenantService: TenantService, dataSource: DataSource) => {
      console.log(`[ContentBlockTenantProvider] Creating repository for schema: ${tenantService.getActiveTenant().schema}`)
      return createTenantAwareRepository(dataSource, tenantService)
    },
    inject: [TenantService, resources.DATA_SOURCE_POSTGRES],
  },
]