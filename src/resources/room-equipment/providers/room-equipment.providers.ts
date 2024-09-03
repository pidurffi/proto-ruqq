import { DataSource } from 'typeorm'

import { RoomEquipment } from '../entities/room-equipment.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const RoomEquipmentProviders = [
  {
    provide: repositories.ROOMEQUIPMENT_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(RoomEquipment),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
