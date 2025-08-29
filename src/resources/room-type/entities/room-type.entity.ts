import { Entity, Column, OneToMany } from 'typeorm'

import { EntityBase } from '../../../common/entities/base.entity'
import { BaseRatePeriod } from '../../base-rate-period/entities/base-rate-period.entity'

@Entity({ name: 'room_type' })
export class RoomType extends EntityBase {
  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string

  @Column({ 
    type: 'varchar', 
    length: 10, 
    unique: true, 
    nullable: false,
    comment: 'Código corto, ej: DBL_STE'
  })
  code: string

  @Column({ 
    type: 'int',
    name: 'total_inventory',
    nullable: false,
    default: 1,
    comment: 'Cantidad total de habitaciones físicas de este tipo'
  })
  totalInventory: number

  @Column({ 
    type: 'int',
    name: 'base_capacity',
    nullable: false,
    comment: 'Ocupación incluida en el precio estándar'
  })
  baseCapacity: number

  @Column({ 
    type: 'int',
    name: 'max_capacity',
    nullable: false,
    comment: 'Límite máximo de personas'
  })
  maxCapacity: number

  @OneToMany(() => BaseRatePeriod, baseRatePeriod => baseRatePeriod.roomType)
  baseRatePeriods: BaseRatePeriod[]
}
