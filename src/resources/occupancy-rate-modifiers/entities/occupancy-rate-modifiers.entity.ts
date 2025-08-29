import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'

import { EntityBase } from '../../../common/entities/base.entity'
import { BaseRatePeriod } from '../../base-rate-period/entities/base-rate-period.entity'

export enum ModifierType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage'
}

@Entity({ name: 'occupancy_rate_modifiers' })
export class OccupancyRateModifiers extends EntityBase {
  @Column({ type: 'uuid', name: 'base_rate_period_id', nullable: false })
  baseRatePeriodId: string

  @Column({ 
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'modifier_value',
    nullable: false,
    comment: 'El valor del modificador (ej: 15000 para fixed o 20 para percentage)'
  })
  modifierValue: number

  @Column({
    type: 'enum',
    enum: ModifierType,
    name: 'modifier_type',
    nullable: false,
    comment: 'Tipo de cálculo: fixed (valor fijo) o percentage (porcentaje)'
  })
  modifierType: ModifierType

  @ManyToOne(() => BaseRatePeriod)
  @JoinColumn({ name: 'base_rate_period_id' })
  baseRatePeriod: BaseRatePeriod
}
