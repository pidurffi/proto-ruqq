import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'

import { EntityBase } from '../../../common/entities/base.entity'
import { RoomType } from '../../room-type/entities/room-type.entity'
import { AdjustmentType } from '../../../common/enums/adjustment-type.enum'

@Entity({ name: 'price_rules' })
export class PriceRule extends EntityBase {
  @Column({ type: 'uuid', name: 'room_type_id' })
  roomTypeId: string

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date

  @Column({ 
    type: 'int', 
    array: true,
    name: 'days_of_week',
    comment: 'ISO 8601: Lunes=1, Martes=2, ..., Domingo=7'
  })
  daysOfWeek: number[]

  @Column({ 
    type: 'int',
    default: 0,
    comment: 'Para resolver conflictos. Mayor número = mayor prioridad'
  })
  priority: number

  @Column({ 
    type: 'enum', 
    enum: AdjustmentType,
    name: 'adjustment_type'
  })
  adjustmentType: AdjustmentType

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    name: 'adjustment_value'
  })
  adjustmentValue: number

  @ManyToOne(() => RoomType)
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType
}
