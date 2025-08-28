import { DataSource } from 'typeorm'

import { BaseRatePeriod } from '../entities/base-rate-period.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const BaseRatePeriodProviders = [
  {
    provide: repositories.BASE_RATE_PERIOD_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(BaseRatePeriod),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
