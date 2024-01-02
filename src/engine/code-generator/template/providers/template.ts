import { DataSource } from 'typeorm'

import { Template } from '../entities/template'
import { resources } from '../../../database/constants'
import { repositories } from '../constants'

export const TemplateProviders = [
  {
    provide: repositories.TEMPLATE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Template),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
