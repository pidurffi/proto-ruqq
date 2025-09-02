import { DataSource } from 'typeorm'

import { PriceRule } from '../entities/price-rules.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const PriceRulesProviders = [
  {
    provide: repositories.PRICE_RULES_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(PriceRule),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
