import { DataSource } from 'typeorm'

import { Equipment } from '../entities/equipment.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const EquipmentProviders = [
  {
    provide: repositories.EQUIPMENT_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Equipment),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
