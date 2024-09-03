import { DataSource } from 'typeorm'

import { SectionImg } from '../entities/section-img.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const SectionImgProviders = [
  {
    provide: repositories.SECTIONIMG_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(SectionImg),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
