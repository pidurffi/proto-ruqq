import { DataSource } from 'typeorm'

import { QuoteTemplate } from '../entities/quote-template.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const QuoteTemplateProviders = [
  {
    provide: repositories.QUOTE_TEMPLATE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(QuoteTemplate),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
