import { DataSource } from 'typeorm'

import { RoomImg } from '../entities/room-img.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const RoomImgProviders = [
  {
    provide: repositories.ROOMIMG_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(RoomImg),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
