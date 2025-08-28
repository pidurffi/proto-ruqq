import { DataSource } from 'typeorm'

import { RoomType } from '../entities/room-type.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const RoomTypeProviders = [
  {
    provide: repositories.ROOM_TYPE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(RoomType),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
