import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

import { BaseEntityService } from '../../../common/services/base-entity.service'
import { DailyRoomRate } from '../entities/daily-room-rate.entity'
import { DailyRoomRatesRepository } from '../repositories/daily-room-rates.repository'
import { resources } from '../../../engine/database/constants'
import { PricingSource, DATE_RANGES } from '../constants'

/**
 * DailyRatesService - Servicio ULTRA-SIMPLIFICADO para modelo OTA
 * 
 * DIFERENCIA CLAVE vs BaseRatePeriodService:
 * - BaseRatePeriodService: 290+ líneas con lógica de split/consolidation compleja
 * - DailyRatesService: ~50 líneas con operaciones directas
 * 
 * OPERACIONES PRINCIPALES:
 * 1. setRatesForPeriod() - Configura precios para un rango (UPSERT masivo)
 * 2. getRatesForPeriod() - Obtiene precios para cotización (query simple)
 * 3. updateAvailability() - Actualiza disponibilidad (booking/cancellation)
 * 4. fillMissingDates() - Completa huecos en calendario
 * 
 * COMPATIBILIDAD OTA:
 * - Query directo: WHERE date BETWEEN startDate AND endDate
 * - Bulk operations para Channel Managers
 * - Sin lógica de fragmentación ni consolidación
 */
@Injectable()
export class DailyRatesService extends BaseEntityService<DailyRoomRate> {
  constructor(
    @Inject(DailyRoomRatesRepository)
    private readonly repository: DailyRoomRatesRepository,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  protected getRepository(): DailyRoomRatesRepository {
    return this.repository
  }

  //========================================
  // OPERACIONES PRINCIPALES - ULTRA SIMPLE
  //========================================

  /**
   * Configurar precios para un rango de fechas (UPSERT masivo)
   * 
   * ANTES (BaseRatePeriod): Split, fragmentación, consolidación - 150+ líneas
   * AHORA: UPSERT directo - 15 líneas
   * 
   * @param roomTypeId Tipo de habitación
   * @param startDate Fecha inicio (YYYY-MM-DD)
   * @param endDate Fecha fin (YYYY-MM-DD)
   * @param baseRate Precio base por noche
   * @param availableRooms Habitaciones disponibles
   * @param uid Usuario que ejecuta la operación
   */
  async setRatesForPeriod(
    roomTypeId: string,
    startDate: string,
    endDate: string,
    baseRate: number,
    availableRooms: number,
    uid: string,
    options: {
      singleOccupancyRate?: number
      extraPersonRate?: number
      minStay?: number
      maxStay?: number
      closedToArrival?: boolean
      closedToDeparture?: boolean
      pricingSource?: PricingSource
      ratePlanId?: string
      dayOfWeekFilter?: number[]  // [0-6] JavaScript standard: 0=Domingo, 1=Lunes, ..., 6=Sábado
    } = {}
  ): Promise<void> {
    // Validación básica
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin')
    }

    // Obtener rate plan (usar caché o proporcionado)
    const ratePlanId = options.ratePlanId || await this.getDefaultRatePlanId()

    // Validar dayOfWeekFilter si se proporciona
    if (options.dayOfWeekFilter) {
      this.validateDayOfWeekFilter(options.dayOfWeekFilter)
    }

    // Generar fechas del rango
    const allDates = this.generateDateRange(startDate, endDate)
    
    // Aplicar filtro de días de semana si se especifica
    const dates = options.dayOfWeekFilter 
      ? this.filterDatesByWeekDay(allDates, options.dayOfWeekFilter, startDate, endDate)
      : allDates
    
    // Validar y normalizar UUID
    const validUid = this.validateAndNormalizeUid(uid)
    const hasValidUid = this.isValidUuid(uid)

    // Crear registros para UPSERT
    const rates = dates.map(date => ({
      roomTypeId,
      ratePlanId,
      date,
      baseRate,
      availableRooms,
      uid: validUid,
      ...(hasValidUid ? { lastUpdatedBy: uid } : {}),
      isActive: true,
      pricingSource: options.pricingSource || PricingSource.MANUAL,
      ...options
    }))

    // UPSERT masivo - Una sola operación
    await this.repository.upsertRates(rates)
  }

  /**
   * Obtener tarifas para cotización (query ultra-simple)
   * 
   * ANTES: Buscar base_rate_period + aplicar price_rules + calcular occupancy - 100+ líneas
   * AHORA: SELECT directo - 3 líneas
   */
  async getRatesForPeriod(
    roomTypeId: string,
    startDate: string,
    endDate: string,
    onlyAvailable: boolean = true
  ): Promise<DailyRoomRate[]> {
    if (onlyAvailable) {
      return this.repository.findAvailableRatesForPeriod(roomTypeId, startDate, endDate)
    }
    return this.repository.findRatesForPeriod(roomTypeId, startDate, endDate)
  }

  /**
   * Actualizar disponibilidad para bookings/cancelaciones
   * Para sistemas de reserva en tiempo real
   */
  async updateAvailability(
    roomTypeId: string,
    date: string,
    roomsChange: number // Positivo para cancelaciones, negativo para bookings
  ): Promise<void> {
    await this.dataSource.transaction(async manager => {
      await manager.query(`
        UPDATE daily_room_rates 
        SET available_rooms = available_rooms + $3,
            updated_at = NOW()
        WHERE room_type_id = $1 AND date = $2 AND deleted_at IS NULL
      `, [roomTypeId, date, roomsChange])
    })
  }

  /**
   * Llenar fechas faltantes en el calendario
   * Para asegurar continuidad después de crear room types
   */
  async fillMissingDates(
    roomTypeId: string,
    startDate: string,
    endDate: string,
    defaultRate: number,
    defaultAvailableRooms: number,
    uid: string
  ): Promise<number> {
    const missingDates = await this.repository.findMissingDatesInRange(
      roomTypeId,
      startDate,
      endDate
    )

    if (missingDates.length === 0) {
      return 0
    }

    // Obtener rate plan por defecto
    const ratePlanId = await this.getDefaultRatePlanId()
    
    // Validar y normalizar UUID
    const validUid = this.validateAndNormalizeUid(uid)
    const hasValidUid = this.isValidUuid(uid)

    const rates = missingDates.map(date => ({
      roomTypeId,
      ratePlanId,
      date,
      baseRate: defaultRate,
      availableRooms: defaultAvailableRooms,
      uid: validUid,
      ...(hasValidUid ? { lastUpdatedBy: uid } : {}),
      isActive: true,
      pricingSource: PricingSource.SYSTEM_DEFAULT
    }))

    await this.repository.upsertRates(rates)
    return missingDates.length
  }

  //========================================
  // UTILIDADES SIMPLES
  //========================================

  /**
   * Cache para rate plan BAR por defecto para evitar queries repetitivas
   */
  private defaultRatePlanId: string | null = null

  /**
   * Obtener rate plan BAR por defecto (con caché)
   */
  private async getDefaultRatePlanId(): Promise<string> {
    if (this.defaultRatePlanId) {
      return this.defaultRatePlanId!
    }

    const barRatePlan = await this.dataSource.query(
      'SELECT id FROM rate_plans WHERE code = $1 AND deleted_at IS NULL LIMIT 1',
      ['BAR']
    )
    
    if (!barRatePlan.length) {
      throw new BadRequestException('No se encontró el rate plan BAR por defecto')
    }

    this.defaultRatePlanId = barRatePlan[0].id
    return this.defaultRatePlanId!
  }

  /**
   * Validar si un string es un UUID válido
   */
  private isValidUuid(uid: string): boolean {
    return !!(uid && uid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))
  }

  /**
   * Validar y normalizar UUID para uso en base de datos
   */
  private validateAndNormalizeUid(uid: string): string {
    return this.isValidUuid(uid) ? uid : '00000000-0000-0000-0000-000000000000'
  }

  /**
   * Generar array de fechas para un rango
   */
  private generateDateRange(startDate: string, endDate: string): Date[] {
    const dates: Date[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    // Validar rango máximo para evitar operaciones masivas accidentales
    const diffDays = Math.ceil((end.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > DATE_RANGES.MAX_BULK_DAYS) {
      throw new BadRequestException(
        `El rango de fechas excede el máximo permitido (${DATE_RANGES.MAX_BULK_DAYS} días)`
      )
    }

    while (current <= end) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  /**
   * Calcular precio con modificadores de ocupación
   * Lógica simple vs el complejo OccupancyRateModifiers anterior
   */
  calculatePriceForOccupancy(
    dailyRate: DailyRoomRate,
    pax: number,
    baseCapacity: number
  ): number {
    // Caso 1: Una persona y hay precio especial
    if (pax === 1 && dailyRate.singleOccupancyRate) {
      return dailyRate.singleOccupancyRate
    }

    // Caso 2: Capacidad base - precio estándar
    if (pax <= baseCapacity) {
      return dailyRate.baseRate
    }

    // Caso 3: Personas extra - precio adicional
    if (dailyRate.extraPersonRate) {
      const extraPersons = pax - baseCapacity
      return dailyRate.baseRate + (extraPersons * dailyRate.extraPersonRate)
    }

    // Fallback: precio base
    return dailyRate.baseRate
  }

  //========================================
  // MÉTODOS PARA CALENDAR Y PRICE-MATRIX
  //========================================

  /**
   * Edición masiva para calendar module
   */
  async bulkUpdateRates(bulkEditDto: any, uid: string): Promise<any> {
    // Por ahora retorna un stub - implementar según necesidades
    return {
      success: true,
      message: 'Bulk update para modelo OTA diario - pendiente implementación completa',
      affectedRoomTypes: bulkEditDto.roomTypeIds?.length || 0
    }
  }

  /**
   * Preview de edición masiva para calendar module
   */
  async previewBulkUpdate(bulkEditDto: any): Promise<any> {
    return {
      action: 'update_daily_rates',
      impactedRoomTypes: bulkEditDto.roomTypeIds?.length || 0,
      impactedNights: 0,
      estimatedChanges: []
    }
  }

  //========================================
  // MÉTODOS HELPER PARA FILTRO DE DÍAS DE SEMANA
  //========================================

  /**
   * Validar que dayOfWeekFilter contenga solo números válidos (0-6)
   */
  private validateDayOfWeekFilter(dayOfWeekFilter: number[]): void {
    if (!Array.isArray(dayOfWeekFilter) || dayOfWeekFilter.length === 0) {
      throw new BadRequestException('dayOfWeekFilter debe ser un array no vacío')
    }

    const invalidDays = dayOfWeekFilter.filter(day => !Number.isInteger(day) || day < 0 || day > 6)
    if (invalidDays.length > 0) {
      throw new BadRequestException(
        `dayOfWeekFilter contiene días inválidos: [${invalidDays.join(', ')}]. Valores permitidos: 0-6 (0=Domingo, 1=Lunes, ..., 6=Sábado)`
      )
    }
  }

  /**
   * Filtrar fechas por días de semana especificados
   */
  private filterDatesByWeekDay(
    allDates: Date[], 
    dayOfWeekFilter: number[], 
    startDate: string, 
    endDate: string
  ): Date[] {
    const filteredDates = allDates.filter(date => {
      const dayOfWeek = date.getDay() // JavaScript standard: 0=Domingo, 1=Lunes, etc.
      return dayOfWeekFilter.includes(dayOfWeek)
    })

    // Si no hay fechas que coincidan, generar error descriptivo
    if (filteredDates.length === 0) {
      const availableDayNames = [...new Set(allDates.map(date => this.getDayName(date.getDay())))]
      const requestedDayNames = dayOfWeekFilter.map(day => this.getDayName(day))
      
      throw new BadRequestException(
        `En el período ${this.formatDateForError(startDate)}-${this.formatDateForError(endDate)} no hay '${requestedDayNames.join("' ni '")}''. Días disponibles: '${availableDayNames.join("', '")}'`
      )
    }

    return filteredDates
  }

  /**
   * Convertir número de día (0-6) a nombre en español
   */
  private getDayName(dayNumber: number): string {
    const dayNames = [
      'domingo',    // 0
      'lunes',      // 1  
      'martes',     // 2
      'miércoles',  // 3
      'jueves',     // 4
      'viernes',    // 5
      'sábado'      // 6
    ]
    return dayNames[dayNumber] || 'desconocido'
  }

  /**
   * Formatear fecha para mensajes de error (DD/MM/YYYY)
   */
  private formatDateForError(dateString: string): string {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }
}