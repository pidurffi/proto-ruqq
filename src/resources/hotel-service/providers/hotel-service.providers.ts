import { DataSource } from 'typeorm'

import { HotelService } from '../entities/hotel-service.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const HotelServiceProviders = [
  {
    provide: repositories.HOTELSERVICE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(HotelService),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
