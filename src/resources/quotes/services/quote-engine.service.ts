import { Inject, Injectable, BadRequestException } from '@nestjs/common'

import { DailyRoomRatesRepository } from '../../daily-room-rates/repositories/daily-room-rates.repository'
import { RoomTypeRepository } from '../../room-type/repositories/room-type.repository'
import { QuoteBudgetDto, QuoteResponseDto, RoomTypeQuoteDto, QuoteSegmentDto, UnavailableRoomTypeDto, RejectionReasonCode } from '../dto'

/**
 * QuoteEngineService - Presupuestador Simple y Limpio
 * 
 * ARQUITECTURA NUEVA:
 * - Fresh start sin legacy code
 * - Aprovecha daily_room_rates completamente
 * - Multi-tenant desde el inicio
 * - Lógica simple y directa
 * - Compatible con datos seedeados
 */
@Injectable()
export class QuoteEngineService {
  constructor(
    @Inject(DailyRoomRatesRepository)
    private readonly dailyRatesRepository: DailyRoomRatesRepository,
    @Inject(RoomTypeRepository)
    private readonly roomTypeRepository: RoomTypeRepository,
  ) {}

  /**
   * Calcular cotización - NUEVO MOTOR LIMPIO
   */
  async calculateQuote(quoteBudgetDto: QuoteBudgetDto): Promise<QuoteResponseDto> {
    const { pax, checkInDate, checkOutDate } = quoteBudgetDto

    // Validar fechas
    this.validateDates(checkInDate.toString(), checkOutDate.toString())

    // Obtener room types disponibles (tenant-aware)
    const roomTypes = await this.roomTypeRepository.find()

    // Logging removido para producción

    if (roomTypes.length === 0) {
      throw new BadRequestException('No hay tipos de habitación disponibles')
    }

    const available: RoomTypeQuoteDto[] = []
    const unavailable: UnavailableRoomTypeDto[] = []

    // Evaluar cada room type
    for (const roomType of roomTypes) {
      const evaluation = await this.evaluateRoomType(roomType, checkInDate.toString(), checkOutDate.toString(), pax)
      
      if (evaluation.available && evaluation.quote) {
        available.push(evaluation.quote)
      } else if (evaluation.rejection) {
        unavailable.push(evaluation.rejection)
      }
    }

    return {
      pax,
      checkInDate: checkInDate.toString(),
      checkOutDate: checkOutDate.toString(),
      available,
      unavailable
    }
  }

  /**
   * Evaluar un room type específico
   */
  private async evaluateRoomType(
    roomType: any,
    checkIn: string,
    checkOut: string,
    pax: number
  ): Promise<{
    available: boolean
    quote?: RoomTypeQuoteDto
    rejection?: UnavailableRoomTypeDto
  }> {
    // Información básica del room type
    const roomTypeInfo: {
      id: string
      name: string
      code: string
      baseCapacity: number
      maxCapacity: number
    } = {
      id: roomType.id,
      name: roomType.name,
      code: roomType.code,
      baseCapacity: roomType.baseCapacity,
      maxCapacity: roomType.maxCapacity
    }

    // 1. Verificar capacidad
    if (pax > roomType.maxCapacity) {
      return {
        available: false,
        rejection: {
          roomType: roomTypeInfo,
          reasonCode: RejectionReasonCode.CAPACITY_EXCEEDED,
          reasonMessage: `Capacidad excedida: ${pax} huéspedes > ${roomType.maxCapacity} máximo`
        }
      }
    }

    // 2. Calcular noches requeridas
    const nightsNeeded = this.calculateNights(checkIn, checkOut)
    
    // 3. Obtener tarifas diarias para el período
    const startDate = checkIn
    const endDate = this.subtractDays(checkOut, 1) // La última noche es checkout-1

    // BYPASS TEMPORAL: Usar query directo hasta que se solucione tenant-aware
    const dailyRates = await this.dailyRatesRepository.query(`
      SELECT 
        id,
        room_type_id as "roomTypeId",
        date,
        base_rate as "baseRate",
        is_active as "isActive",
        available_rooms as "availableRooms",
        closed_to_arrival as "closedToArrival",
        closed_to_departure as "closedToDeparture",
        min_stay as "minStay",
        max_stay as "maxStay"
      FROM daily_room_rates 
      WHERE room_type_id = $1 
        AND date >= $2 
        AND date <= $3 
        AND is_active = true
      ORDER BY date ASC
    `, [roomType.id, startDate, endDate])

    // 4. Verificar que tenemos tarifas para todas las noches
    if (dailyRates.length !== nightsNeeded) {
      return {
        available: false,
        rejection: {
          roomType: roomTypeInfo,
          reasonCode: RejectionReasonCode.NO_RATES_CONFIGURED,
          reasonMessage: `Faltan tarifas: ${dailyRates.length}/${nightsNeeded} noches disponibles`
        }
      }
    }

    // 5. Crear segmentos de precios (un segmento por noche)
    const segments: QuoteSegmentDto[] = []
    let totalPrice = 0

    for (const rate of dailyRates) {
      // Por ahora precio base simple - en el futuro se puede expandir
      const nightPrice = parseFloat(rate.baseRate.toString())
      const dateStr = new Date(rate.date).toISOString().split('T')[0]

      segments.push({
        startDate: dateStr,
        endDate: dateStr,
        pricePerNight: nightPrice,
        nights: 1,
        subtotal: nightPrice
      })

      totalPrice += nightPrice
    }

    // 6. Crear cotización exitosa
    return {
      available: true,
      quote: {
        roomType: roomTypeInfo,
        totalNights: nightsNeeded,
        segments,
        totalPrice: Math.round(totalPrice * 100) / 100
      }
    }
  }

  // Método removido - lógica simplificada inline

  /**
   * Validar fechas de entrada
   */
  private validateDates(checkIn: string, checkOut: string): void {
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (checkInDate >= checkOutDate) {
      throw new BadRequestException('La fecha de check-in debe ser anterior al check-out')
    }

    if (checkInDate < new Date()) {
      throw new BadRequestException('La fecha de check-in no puede ser en el pasado')
    }
  }

  /**
   * Calcular número de noches entre fechas
   */
  private calculateNights(checkIn: string, checkOut: string): number {
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const diffTime = checkOutDate.getTime() - checkInDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Restar días a una fecha
   */
  private subtractDays(dateString: string, days: number): string {
    const date = new Date(dateString)
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
  }
}