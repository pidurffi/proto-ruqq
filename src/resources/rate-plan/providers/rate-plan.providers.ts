import { DataSource } from 'typeorm'

import { RatePlan } from '../entities/rate-plan.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const RatePlanProviders = [
  {
    provide: repositories.RATE_PLAN_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(RatePlan),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
