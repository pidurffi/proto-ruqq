import { DataSource } from 'typeorm'

import { QuoteTemplate } from '../entities/quote-template.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'
import { TenantService } from '../../../common/services/tenant.service'

/**
 * Crea un repositorio tenant-aware que cambia de schema dinámicamente
 */
function createTenantAwareRepository(dataSource: DataSource, tenantService: TenantService) {
  return new Proxy(dataSource.getRepository(QuoteTemplate), {
    get(target, prop, receiver) {
      // Interceptar métodos de consulta para cambiar schema dinámicamente
      if (typeof (target as any)[prop] === 'function' && 
          ['find', 'findOne', 'findBy', 'findOneBy', 'save', 'create', 'update', 'delete', 'remove', 'createQueryBuilder', 'preload'].includes(prop as string)) {
        
        return function(...args: any[]) {
          const tenantContext = tenantService.getActiveTenant()
          console.log(`[QuoteTemplateTenantProvider] Executing ${String(prop)} on schema: ${tenantContext.schema}`)
          
          // Para schema public, usar comportamiento por defecto
          if (tenantContext.schema === 'public') {
            return (target as any)[prop].apply(target, args)
          }
          
          // Para createQueryBuilder, cambiar el schema
          if (prop === 'createQueryBuilder') {
            const queryBuilder = (target as any).createQueryBuilder.apply(target, args)
            queryBuilder.from(`${tenantContext.schema}.quote_template`, args[0] || 'quoteTemplate')
            return queryBuilder
          }
          
          // Para otros métodos, ejecutar en transacción con schema específico
          return dataSource.transaction(async manager => {
            await manager.query(`SET search_path TO "${tenantContext.schema}", public`)
            const repoWithSchema = manager.getRepository(QuoteTemplate)
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
 * Provider tenant-aware para QuoteTemplate
 */
export const QuoteTemplateTenantProviders = [
  {
    provide: repositories.QUOTE_TEMPLATE_REPOSITORY,
    useFactory: (tenantService: TenantService, dataSource: DataSource) => {
      console.log(`[QuoteTemplateTenantProvider] Creating repository for schema: ${tenantService.getActiveTenant().schema}`)
      return createTenantAwareRepository(dataSource, tenantService)
    },
    inject: [TenantService, resources.DATA_SOURCE_POSTGRES],
  },
]