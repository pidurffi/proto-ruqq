import { Inject, Injectable } from '@nestjs/common'
//import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Hotel } from '../entities/hotel.entity'
import { repositories } from '../constants'
import { HotelQueryDto } from '../dto/hotel.dto'
import { PaginationDto } from '../../../common'

@Injectable()
export class HotelRepository extends Repository<Hotel> {
  constructor(@Inject(repositories.HOTEL_REPOSITORY) private readonly _: Repository<Hotel>) {
    super(_.target, _.manager, _.queryRunner)
  }

  async getHotel() {
    const query = this.createQueryBuilder('hotel')
      .leftJoin('hotel.hotelImgs', 'hotelImg')
      .leftJoin('hotel.hotelServices', 'hotelService')
      .leftJoin('hotelService.service', 'service')
      .select('hotel.id')
      .addSelect('hotel.name')
      .addSelect('hotel.imgCoverPath')
      .addSelect('hotel.imgCoverThumbPath')
      .addSelect('hotel.sectionTitle ')
      .addSelect('hotel.address')
      .addSelect('hotel.phone')
      .addSelect('hotel.description')
      .addSelect('hotel.whatsapp')
      .addSelect('hotel.instagram')
      .addSelect('hotel.facebook')
      .addSelect('hotel.gpsCoords')
      .addSelect('hotel.email')

      .addSelect('hotelImg.id')
      .addSelect('hotelImg.imgPath')
      .addSelect('hotelImg.imgThumbPath')

      .addSelect('hotelService.id')
      .addSelect('service.name')
      .addSelect('service.slug')

    return query.getMany()
  }

  async findByFiltersPaginated(payload: HotelQueryDto) {
    const { page, pageSize, sortBy, sortOrder } = payload

    const pageNumber = page ?? 0
    const take = pageSize ?? 10
    const skip = Math.max(0, pageNumber) * take
    const query = this.createQueryBuilder('template')

    if (sortBy && sortOrder) {
      let sortByColumn = sortBy
      const column = this.metadata?.columns?.find(column => column.propertyName === sortByColumn)
      if (!column) sortByColumn = 'id'
      const order = sortOrder.toString() as 'ASC' | 'DESC'
      query.orderBy(`template.${sortBy}`, order)
    }
    const data = await query.take(take).skip(skip).getMany()
    const total = await query.getCount()

    return new PaginationDto({
      data,
      page,
      pageSize: take,
      lastPage: total ? Math.ceil(total / take) - 1 : 0,
      total,
    })
  }
}
