import { DataSource } from 'typeorm'

import { Room } from '../entities/room.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const RoomProviders = [
  {
    provide: repositories.ROOM_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Room),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
