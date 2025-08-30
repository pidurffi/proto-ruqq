import { DataSource } from 'typeorm'

import { QuoteTemplateBlock } from '../entities/quote-template-block.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const QuoteTemplateBlockProviders = [
  {
    provide: repositories.QUOTE_TEMPLATE_BLOCK_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(QuoteTemplateBlock),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
