import { DataSource } from 'typeorm'

import { ContentBlock } from '../entities/content-block.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const ContentBlockProviders = [
  {
    provide: repositories.CONTENT_BLOCK_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ContentBlock),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
