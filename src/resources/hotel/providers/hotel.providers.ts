import { DataSource } from 'typeorm'

import { Hotel } from '../entities/hotel.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const HotelProviders = [
  {
    provide: repositories.HOTEL_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Hotel),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
