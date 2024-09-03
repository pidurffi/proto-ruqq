import { DataSource } from 'typeorm'

import { Banner } from '../entities/banner.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const BannerProviders = [
  {
    provide: repositories.BANNER_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Banner),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
