import { DataSource } from 'typeorm'

import { OccupancyRateModifiers } from '../entities/occupancy-rate-modifiers.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const OccupancyRateModifiersProviders = [
  {
    provide: repositories.OCCUPANCY_RATE_MODIFIERS_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(OccupancyRateModifiers),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
