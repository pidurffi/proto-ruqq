import { DataSource } from 'typeorm'

import { HotelImg } from '../entities/hotel-img.entity'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

export const HotelImgProviders = [
  {
    provide: repositories.HOTELIMG_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(HotelImg),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
