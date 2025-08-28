import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'

import { EntityBase } from '../../../common/entities/base.entity'
import { RoomType } from '../../room-type/entities/room-type.entity'

@Entity({ name: 'base_rate_period' })
export class BaseRatePeriod extends EntityBase {
  @Column({ type: 'int', name: 'room_type_id', nullable: false })
  roomTypeId: number

  @Column({ type: 'date', name: 'start_date', nullable: false })
  startDate: Date

  @Column({ type: 'date', name: 'end_date', nullable: false })
  endDate: Date

  @Column({ 
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    comment: 'Precio base que aplica a todo el rango'
  })
  price: number

  @ManyToOne(() => RoomType)
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType
}
