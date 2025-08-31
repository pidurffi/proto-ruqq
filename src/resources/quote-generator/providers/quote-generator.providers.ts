import { DataSource } from 'typeorm'

import { QuoteGenerator } from '../entities/quote-generator.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const QuoteGeneratorProviders = [
  {
    provide: repositories.QUOTE_GENERATOR_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(QuoteGenerator),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
