import { DataSource } from 'typeorm'

import { Quotes } from '../entities/quotes.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const QuotesProviders = [
  {
    provide: repositories.QUOTES_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Quotes),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
