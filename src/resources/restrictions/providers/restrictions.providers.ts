import { DataSource } from 'typeorm'

import { Restrictions } from '../entities/restrictions.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const RestrictionsProviders = [
  {
    provide: repositories.RESTRICTIONS_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Restrictions),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
