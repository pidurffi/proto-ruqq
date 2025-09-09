import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm'

import { EntityBase } from '../../../common/entities/base.entity'
import { DailyRoomRate } from '../../daily-room-rates/entities/daily-room-rate.entity'

/**
 * RatePlan - Planes de Tarifas (Estándar OTA)
 * 
 * BASADO EN BOOKING.COM API:
 * - OTA_HotelRatePlanNotif XML structure
 * - Rate Plan como contenedor organizacional de precios
 * - Soporte para derived rate plans (planes derivados)
 * - Políticas de cancelación por rate plan
 * 
 * EJEMPLOS DE USO:
 * - BAR (Best Available Rate): Tarifa base flexible
 * - Non-Refundable Rate: Tarifa no reembolsable (-10% del BAR)
 * - Advance Purchase 7: Reserva con 7 días anticipación (-15% del BAR)
 * - Con Desayuno vs Sin Desayuno: Diferentes servicios incluidos
 * - Corporate Rate: Tarifas empresariales
 * 
 * CAMPOS AVANZADOS:
 * - parent_rate_plan_id: Para rate plans que heredan de otro
 * - parent_adjustment_percent: % de ajuste automático respecto al parent
 * - advance_purchase_days: Días mínimos de anticipación para reservar
 */
@Entity({ name: 'rate_plans' })
@Index('idx_rate_plans_code', ['code'], { unique: true })
@Index('idx_rate_plans_active', ['isActive'])
@Index('idx_rate_plans_parent', ['parentRatePlanId'])
export class RatePlan extends EntityBase {
  //========================================
  // IDENTIFICACIÓN Y NOMBRE
  //========================================

  @Column({ 
    type: 'varchar', 
    length: 100, 
    nullable: false,
    comment: 'Nombre descriptivo del plan de tarifas'
  })
  name: string

  @Column({ 
    type: 'varchar', 
    length: 20, 
    nullable: false,
    unique: true,
    comment: 'Código único del rate plan (BAR, NRF, ADV7, BB, RO, etc.)'
  })
  code: string

  @Column({ 
    type: 'text', 
    nullable: true,
    comment: 'Descripción detallada del rate plan y sus condiciones'
  })
  description?: string

  //========================================
  // CARACTERÍSTICAS DEL RATE PLAN
  //========================================

  @Column({ 
    type: 'boolean', 
    default: true, 
    nullable: false,
    name: 'is_refundable',
    comment: 'Permite cancelación con reembolso (true) o no reembolsable (false)'
  })
  isRefundable: boolean

  @Column({ 
    type: 'int', 
    nullable: true,
    name: 'advance_purchase_days',
    comment: 'Días mínimos de anticipación requeridos para reservar con este plan'
  })
  advancePurchaseDays?: number

  @Column({ 
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'included_services',
    comment: 'Servicios incluidos: breakfast, dinner, spa_access, etc.'
  })
  includedServices?: string

  //========================================
  // RATE PLANS DERIVADOS (AVANZADO)
  //========================================

  @Column({ 
    type: 'uuid', 
    nullable: true,
    name: 'parent_rate_plan_id',
    comment: 'ID del rate plan padre del cual hereda precios (para derived rates)'
  })
  parentRatePlanId?: string

  @Column({ 
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'parent_adjustment_percent',
    comment: 'Porcentaje de ajuste respecto al parent rate plan (+/- %)'
  })
  parentAdjustmentPercent?: number

  //========================================
  // RESTRICCIONES Y POLÍTICAS
  //========================================

  @Column({ 
    type: 'int', 
    nullable: true,
    name: 'default_min_stay',
    comment: 'Estancia mínima por defecto para este rate plan'
  })
  defaultMinStay?: number

  @Column({ 
    type: 'int', 
    nullable: true,
    name: 'default_max_stay',
    comment: 'Estancia máxima por defecto para este rate plan'
  })
  defaultMaxStay?: number

  @Column({ 
    type: 'int', 
    nullable: true,
    name: 'cancellation_deadline_hours',
    comment: 'Horas antes del check-in para cancelar sin penalidad'
  })
  cancellationDeadlineHours?: number

  @Column({ 
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'cancellation_penalty_type',
    comment: 'Tipo de penalidad: PERCENTAGE, FIXED_AMOUNT, FIRST_NIGHT, FULL_STAY'
  })
  cancellationPenaltyType?: string

  @Column({ 
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'cancellation_penalty_value',
    comment: 'Valor de la penalidad (% o monto fijo según el tipo)'
  })
  cancellationPenaltyValue?: number

  //========================================
  // CONFIGURACIÓN Y ESTADO
  //========================================

  @Column({ 
    type: 'boolean', 
    default: true, 
    nullable: false,
    name: 'is_active',
    comment: 'Rate plan activo y disponible para reservas'
  })
  isActive: boolean

  @Column({ 
    type: 'int',
    default: 0,
    nullable: false,
    name: 'display_order',
    comment: 'Orden de visualización en interfaces (menor = primero)'
  })
  displayOrder: number

  @Column({ 
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'booking_engine_code',
    comment: 'Código para integración con channel managers y OTAs'
  })
  bookingEngineCode?: string

  //========================================
  // METADATOS
  //========================================

  @Column({ 
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'created_by_source',
    comment: 'Origen de creación: manual, channel_manager, api_import'
  })
  createdBySource?: string

  //========================================
  // RELACIONES
  //========================================

  // Self-reference para rate plans derivados
  @ManyToOne(() => RatePlan, ratePlan => ratePlan.derivedRatePlans, { 
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'parent_rate_plan_id' })
  parentRatePlan?: RatePlan

  @OneToMany(() => RatePlan, ratePlan => ratePlan.parentRatePlan)
  derivedRatePlans: RatePlan[]

  // Relación con daily rates
  @OneToMany(() => DailyRoomRate, dailyRate => dailyRate.ratePlan)
  dailyRates: DailyRoomRate[]
}
