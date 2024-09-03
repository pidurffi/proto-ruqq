import { DataSource } from 'typeorm'

import { Metatags } from '../entities/metatags.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const MetatagsProviders = [
  {
    provide: repositories.METATAGS_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Metatags),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
