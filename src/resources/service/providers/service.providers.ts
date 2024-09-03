import { DataSource } from 'typeorm'

import { Service } from '../entities/service.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const ServiceProviders = [
  {
    provide: repositories.SERVICE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Service),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
