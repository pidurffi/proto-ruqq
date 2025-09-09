import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm'

import { EntityBase } from '../../../common/entities/base.entity'
import { RoomType } from '../../room-type/entities/room-type.entity'
import { RatePlan } from '../../rate-plan/entities/rate-plan.entity'

/**
 * DailyRoomRate - Modelo OTA Estándar de Calendario Diario
 * 
 * ARQUITECTURA BASADA EN EVIDENCIA TÉCNICA:
 * - Booking.com XML API: <roomrate date="2023-09-19" price="35.00" />
 * - Airbnb Engineering: "Nightly prices for each check-in date"
 * - GitHub implementations: daily_room_rates con Day_Date
 * - Stack Overflow consensus: "one record for each individual Date / Hotel combination"
 * 
 * REEMPLAZA COMPLETAMENTE:
 * - base_rate_period (rangos complejos)
 * - price_rules (overrides complejos)
 * - occupancy_rate_modifiers (lógica fragmentada)
 * - restrictions (tabla separada)
 * 
 * BENEFICIOS DEL MODELO OTA:
 * - Query ultra-simple: WHERE date BETWEEN startDate AND endDate
 * - Compatibilidad directa con Channel Managers
 * - Performance predecible y escalable
 * - Flexibilidad total por día (como las OTAs reales)
 */
@Entity({ name: 'daily_room_rates' })
@Index('idx_daily_rates_main', ['roomTypeId', 'ratePlanId', 'date'], { unique: true })
@Index('idx_daily_rates_date_active', ['date', 'isActive'])
@Index('idx_daily_rates_availability', ['roomTypeId', 'date', 'availableRooms'])
@Index('idx_daily_rates_rate_plan', ['ratePlanId'])
export class DailyRoomRate extends EntityBase {
  //========================================
  // CLAVE COMPUESTA - ESTILO OTA
  //========================================
  
  @Column({ type: 'uuid', name: 'room_type_id', nullable: false })
  roomTypeId: string

  @Column({ 
    type: 'uuid', 
    name: 'rate_plan_id', 
    nullable: false,
    comment: 'ID del rate plan asociado (BAR, Non-Refundable, Con Desayuno, etc.)'
  })
  ratePlanId: string

  @Column({ 
    type: 'date', 
    nullable: false,
    comment: 'UN REGISTRO POR CADA DÍA - Estándar OTA como Booking.com, Airbnb'
  })
  date: Date

  //========================================
  // PRECIOS POR OCUPACIÓN - INTEGRADO
  //========================================

  @Column({ 
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    name: 'base_rate',
    comment: 'Precio base para la capacidad estándar de la habitación'
  })
  baseRate: number

  @Column({ 
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'single_occupancy_rate',
    comment: 'Precio especial para 1 persona (opcional)'
  })
  singleOccupancyRate?: number

  @Column({ 
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'extra_person_rate',
    comment: 'Precio adicional por persona extra'
  })
  extraPersonRate?: number

  //========================================
  // INVENTORY Y DISPONIBILIDAD
  //========================================

  @Column({ 
    type: 'int',
    default: 0,
    nullable: false,
    name: 'available_rooms',
    comment: 'Habitaciones disponibles para reservar en este día específico'
  })
  availableRooms: number

  @Column({ 
    type: 'boolean',
    default: true,
    nullable: false,
    name: 'is_active',
    comment: 'Día vendible (true) o cerrado (false)'
  })
  isActive: boolean

  //========================================
  // RESTRICCIONES INTEGRADAS - EX-TABLA RESTRICTIONS
  //========================================

  @Column({ 
    type: 'int',
    nullable: true,
    name: 'min_stay',
    comment: 'Estancia mínima requerida para check-ins en este día'
  })
  minStay?: number

  @Column({ 
    type: 'int',
    nullable: true,
    name: 'max_stay',
    comment: 'Estancia máxima permitida para check-ins en este día'
  })
  maxStay?: number

  @Column({ 
    type: 'boolean',
    default: false,
    nullable: false,
    name: 'closed_to_arrival',
    comment: 'No se permiten check-ins en este día (CTA)'
  })
  closedToArrival: boolean

  @Column({ 
    type: 'boolean',
    default: false,
    nullable: false,
    name: 'closed_to_departure',
    comment: 'No se permiten check-outs en este día (CTD)'
  })
  closedToDeparture: boolean

  //========================================
  // METADATOS DE PRICING
  //========================================

  @Column({ 
    type: 'uuid',
    nullable: true,
    name: 'last_updated_by',
    comment: 'Usuario que realizó la última actualización de precio'
  })
  lastUpdatedBy?: string

  @Column({ 
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'pricing_source',
    comment: 'Origen del precio: manual, channel_manager, dynamic_pricing, api_update'
  })
  pricingSource?: string

  //========================================
  // RELACIONES
  //========================================

  @ManyToOne(() => RoomType, { eager: false })
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType

  @ManyToOne(() => RatePlan, { eager: false })
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan
}