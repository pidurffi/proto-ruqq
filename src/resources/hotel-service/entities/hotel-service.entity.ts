import { Entity, Index, ManyToOne } from 'typeorm'

import { EntityBase } from '../../../common/entities/base.entity'
import { Hotel } from '../../hotel/entities/hotel.entity'
import { Service } from '../../service/entities/service.entity'

@Entity()
@Index(['hotel', 'service'], { unique: true })
export class HotelService extends EntityBase {
  @ManyToOne(() => Hotel, hotel => hotel.hotelServices, { onDelete: 'CASCADE' })
  hotel: Hotel

  @ManyToOne(() => Service, service => service.hotelServices, { onDelete: 'CASCADE' })
  service: Service
}
