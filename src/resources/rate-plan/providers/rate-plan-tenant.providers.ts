import { DataSource } from 'typeorm'
import { RatePlan } from '../entities/rate-plan.entity'
import { TenantService } from '../../../common/services/tenant.service'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

function createTenantAwareRepository(dataSource: DataSource, tenantService: TenantService) {
  return new Proxy(dataSource.getRepository(RatePlan), {
    get(target, prop, receiver) {
      if (typeof (target as any)[prop] === 'function' && 
          ['find', 'findOne', 'findBy', 'findOneBy', 'save', 'create', 'update', 'delete', 'remove', 'createQueryBuilder', 'preload'].includes(prop as string)) {
        
        return function(...args: any[]) {
          const tenantContext = tenantService.getActiveTenant()
          console.log(`[RatePlanTenantProvider] Executing ${String(prop)} on schema: ${tenantContext.schema}`)
          
          if (tenantContext.schema === 'public') {
            return (target as any)[prop].apply(target, args)
          }
          
          if (prop === 'createQueryBuilder') {
            const queryBuilder = (target as any).createQueryBuilder.apply(target, args)
            queryBuilder.from(`${tenantContext.schema}.rate_plans`, args[0] || 'ratePlan')
            return queryBuilder
          }
          
          return dataSource.transaction(async manager => {
            await manager.query(`SET search_path TO "${tenantContext.schema}", public`)
            const repoWithSchema = manager.getRepository(RatePlan)
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

export const RatePlanTenantProviders = [
  {
    provide: repositories.RATE_PLAN_REPOSITORY,
    useFactory: (tenantService: TenantService, dataSource: DataSource) => {
      console.log(`[RatePlanTenantProvider] Creating repository for schema: ${tenantService.getActiveTenant().schema}`)
      return createTenantAwareRepository(dataSource, tenantService)
    },
    inject: [TenantService, resources.DATA_SOURCE_POSTGRES],
  },
]