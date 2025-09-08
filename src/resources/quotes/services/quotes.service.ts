import { Inject, Injectable, BadRequestException } from '@nestjs/common'

import { DailyRoomRatesRepository } from '../../daily-room-rates/repositories/daily-room-rates.repository'
import { DailyRatesService } from '../../daily-room-rates/services/daily-room-rates.service'
import { RoomTypeRepository } from '../../room-type/repositories/room-type.repository'
import { QuoteBudgetDto, QuoteResponseDto, RoomTypeQuoteDto, QuoteSegmentDto, UnavailableRoomTypeDto, RejectionReasonCode } from '../dto'

/**
 * QuotesService - REFACTORIZADO para modelo OTA estándar
 * 
 * SIMPLIFICACIÓN MASIVA:
 * - ANTES: 500+ líneas con BaseRatePeriod + PriceRules + OccupancyModifiers + lógica compleja
 * - AHORA: ~100 líneas con query directo a daily_room_rates
 * 
 * ELIMINAMOS COMPLETAMENTE:
 * ❌ BaseRatePeriodRepository y toda su lógica de rangos
 * ❌ PriceRulesService y toda su lógica de overrides
 * ❌ OccupancyRateModifiers y su lógica fragmentada
 * ❌ Restrictions como tabla separada
 * ❌ Método calculateNightlyPrices() de 100+ líneas
 * ❌ Lógica de split/consolidation
 * ❌ Aplicación compleja de reglas día por día
 * 
 * NUEVA LÓGICA ULTRA-SIMPLE:
 * ✅ Una sola query: WHERE date BETWEEN startDate AND endDate
 * ✅ Todo integrado en daily_room_rates (precios + restricciones + disponibilidad)
 * ✅ Cálculo directo de ocupación sin fragmentación
 * ✅ Compatible 100% con APIs de OTAs
 */
@Injectable()
export class QuotesService {
  constructor(
    @Inject(DailyRoomRatesRepository)
    private readonly dailyRatesRepository: DailyRoomRatesRepository,
    @Inject(DailyRatesService)
    private readonly dailyRatesService: DailyRatesService,
    @Inject(RoomTypeRepository)
    private readonly roomTypeRepository: RoomTypeRepository,
  ) {}

  /**
   * Calcular cotización - VERSIÓN ULTRA-SIMPLIFICADA
   * 
   * ANTES: Múltiples consultas + fragmentación + aplicación de reglas + consolidation
   * AHORA: Una consulta directa + cálculo simple
   */
  async calculateQuote(quoteBudgetDto: QuoteBudgetDto): Promise<QuoteResponseDto> {
    const { pax, checkInDate, checkOutDate } = quoteBudgetDto
    const checkIn = checkInDate.toString()
    const checkOut = checkOutDate.toString()

    // Validación básica
    this.validateQuoteRequest(checkIn, checkOut)

    // 1. OBTENER TODOS LOS ROOM TYPES (sin filtro previo)
    const allRoomTypes = await this.getAllRoomTypes()

    if (allRoomTypes.length === 0) {
      throw new BadRequestException('No hay tipos de habitación configurados')
    }

    // 2. EVALUAR CADA ROOM TYPE CON EL MODELO DIARIO
    const available: RoomTypeQuoteDto[] = []
    const unavailable: UnavailableRoomTypeDto[] = []

    for (const roomType of allRoomTypes) {
      const result = await this.evaluateRoomTypeWithDailyModel(roomType, checkIn, checkOut, pax)
      
      if (result.isAvailable) {
        available.push(result.quote!)
      } else {
        unavailable.push(result.rejection!)
      }
    }

    return {
      pax,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      available,
      unavailable
    }
  }

  /**
   * Evaluar room type con modelo diario - ULTRA-SIMPLE
   * 
   * ANTES: 150+ líneas con consultas múltiples y lógica de aplicación de reglas
   * AHORA: 1 query + validaciones directas
   */
  private async evaluateRoomTypeWithDailyModel(
    roomType: any,
    checkIn: string,
    checkOut: string,
    pax: number
  ): Promise<{
    isAvailable: boolean
    quote?: RoomTypeQuoteDto
    rejection?: UnavailableRoomTypeDto
  }> {
    const roomTypeInfo = {
      id: roomType.id,
      name: roomType.name,
      code: roomType.code,
      baseCapacity: roomType.baseCapacity,
      maxCapacity: roomType.maxCapacity
    }

    // PASO A: Verificar capacidad máxima
    if (pax > roomType.maxCapacity) {
      return {
        isAvailable: false,
        rejection: {
          roomType: roomTypeInfo,
          reasonCode: RejectionReasonCode.CAPACITY_EXCEEDED,
          reasonMessage: `Capacidad excedida: ${pax} huéspedes > ${roomType.maxCapacity} máximo`
        }
      }
    }

    // PASO B: OBTENER TODAS LAS TARIFAS DEL PERÍODO (1 QUERY SIMPLE)
    const dailyRates = await this.dailyRatesRepository.findAvailableRatesForPeriod(
      roomType.id,
      checkIn,
      this.subtractDays(checkOut, 1), // checkOut -1 día para noches
      1 // Mínimo 1 habitación disponible
    )

    // Validar que tenemos tarifas para todas las noches necesarias
    const expectedNights = this.calculateNightsBetween(checkIn, this.subtractDays(checkOut, 1))
    
    if (dailyRates.length !== expectedNights) {
      return {
        isAvailable: false,
        rejection: {
          roomType: roomTypeInfo,
          reasonCode: RejectionReasonCode.NO_RATES_CONFIGURED,
          reasonMessage: `Faltan tarifas: ${dailyRates.length}/${expectedNights} noches disponibles`
        }
      }
    }

    // PASO C: VALIDAR RESTRICCIONES INTEGRADAS
    const restrictionError = this.validateIntegratedRestrictions(dailyRates, checkIn, checkOut, expectedNights)
    if (restrictionError) {
      return {
        isAvailable: false,
        rejection: {
          roomType: roomTypeInfo,
          reasonCode: restrictionError.code,
          reasonMessage: restrictionError.message
        }
      }
    }

    // PASO D: CALCULAR PRECIOS Y CREAR SEGMENTOS COMPATIBLES
    const segments = dailyRates.map(rate => {
      const finalPrice = this.dailyRatesService.calculatePriceForOccupancy(
        rate,
        pax,
        roomType.baseCapacity
      )

      const dateStr = rate.date.toISOString().split('T')[0]

      return {
        startDate: dateStr,
        endDate: dateStr, // Para modelo diario, start = end
        pricePerNight: finalPrice,
        nights: 1, // Cada registro es 1 noche
        subtotal: finalPrice
      }
    })

    const totalPrice = segments.reduce((sum, segment) => sum + segment.subtotal, 0)

    // PASO E: ¡ÉXITO! - Cotización lista
    return {
      isAvailable: true,
      quote: {
        roomType: roomTypeInfo,
        totalNights: expectedNights,
        segments,
        totalPrice: Math.round(totalPrice * 100) / 100
      }
    }
  }

  /**
   * Validar restricciones integradas en daily_room_rates
   * ANTES: Consulta separada a tabla restrictions + lógica compleja
   * AHORA: Validación directa en los registros diarios
   */
  private validateIntegratedRestrictions(
    dailyRates: any[],
    checkIn: string,
    checkOut: string,
    expectedNights: number
  ): { code: RejectionReasonCode; message: string } | null {
    // Verificar closed_to_arrival en fecha de check-in
    const checkInRate = dailyRates.find(rate => 
      rate.date.toISOString().split('T')[0] === checkIn
    )
    
    if (checkInRate?.closedToArrival) {
      return {
        code: RejectionReasonCode.CLOSED_TO_ARRIVAL,
        message: `Check-in no permitido el ${checkIn}`
      }
    }

    // Verificar closed_to_departure en fecha de check-out
    const checkOutDateAdjusted = this.subtractDays(checkOut, 1)
    const checkOutRate = dailyRates.find(rate => 
      rate.date.toISOString().split('T')[0] === checkOutDateAdjusted
    )
    
    if (checkOutRate?.closedToDeparture) {
      return {
        code: RejectionReasonCode.CLOSED_TO_DEPARTURE,
        message: `Check-out no permitido el ${checkOut}`
      }
    }

    // Verificar min_stay
    const minStay = Math.max(...dailyRates.map(rate => rate.minStay || 0))
    if (minStay > 0 && expectedNights < minStay) {
      return {
        code: RejectionReasonCode.MIN_STAY_NOT_MET,
        message: `Estancia mínima: ${minStay} noches (solicitadas: ${expectedNights})`
      }
    }

    // Verificar max_stay
    const maxStay = Math.min(...dailyRates.map(rate => rate.maxStay || 365).filter(ms => ms > 0))
    if (maxStay < 365 && expectedNights > maxStay) {
      return {
        code: RejectionReasonCode.MAX_STAY_EXCEEDED,
        message: `Estancia máxima: ${maxStay} noches (solicitadas: ${expectedNights})`
      }
    }

    return null // Sin restricciones
  }

  //========================================
  // UTILIDADES SIMPLES - SIN CAMBIOS
  //========================================

  private validateQuoteRequest(checkIn: string, checkOut: string): void {
    if (checkIn >= checkOut) {
      throw new BadRequestException('La fecha de check-in debe ser anterior al check-out')
    }
  }

  private async getAllRoomTypes(): Promise<any[]> {
    // Usar repositorio tenant-aware para obtener room types
    return this.roomTypeRepository.find({
      select: ['id', 'name', 'code', 'baseCapacity', 'maxCapacity']
    })
  }

  private calculateNightsBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  private subtractDays(dateString: string, days: number): string {
    const date = new Date(dateString)
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
  }
}