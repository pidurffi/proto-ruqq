import { DataSource } from 'typeorm'

import { Section } from '../entities/section.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const SectionProviders = [
  {
    provide: repositories.SECTION_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Section),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
