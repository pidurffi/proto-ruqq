import { Inject, Injectable, BadRequestException } from '@nestjs/common'

import { DailyRoomRatesRepository } from '../../daily-room-rates/repositories/daily-room-rates.repository'
import { RoomTypeRepository } from '../../room-type/repositories/room-type.repository'
import { QuoteBudgetDto, QuoteResponseDto, RoomTypeQuoteDto, QuoteSegmentDto, UnavailableRoomTypeDto, RejectionReasonCode, RatePlanQuoteDto } from '../dto'

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
   * Evaluar un room type específico - NUEVO: Soporte para múltiples rate plans
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
    
    // 3. Obtener tarifas diarias con información de rate plans
    const startDate = checkIn
    const endDate = this.subtractDays(checkOut, 1) // La última noche es checkout-1

    // Query para obtener rates con información de rate plans
    const dailyRatesWithPlans = await this.dailyRatesRepository.query(`
      SELECT 
        drr.id,
        drr.room_type_id as "roomTypeId",
        drr.date,
        drr.base_rate as "baseRate",
        drr.is_active as "isActive",
        drr.rate_plan_id as "ratePlanId",
        rp.name as "ratePlanName",
        rp.code as "ratePlanCode", 
        rp.is_refundable as "isRefundable",
        rp.included_services as "includedServices",
        rp.advance_purchase_days as "advancePurchaseDays",
        rp.cancellation_deadline_hours as "cancellationDeadlineHours",
        rp.cancellation_penalty_type as "cancellationPenaltyType",
        rp.cancellation_penalty_value as "cancellationPenaltyValue"
      FROM daily_room_rates drr
      INNER JOIN rate_plans rp ON drr.rate_plan_id = rp.id
      WHERE drr.room_type_id = $1 
        AND drr.date >= $2 
        AND drr.date <= $3 
        AND drr.is_active = true
        AND rp.is_active = true
      ORDER BY rp.display_order ASC, drr.date ASC
    `, [roomType.id, startDate, endDate])

    // 4. Agrupar por rate plan
    const ratePlanGroups = new Map<string, any[]>()
    for (const rate of dailyRatesWithPlans) {
      if (!ratePlanGroups.has(rate.ratePlanId)) {
        ratePlanGroups.set(rate.ratePlanId, [])
      }
      ratePlanGroups.get(rate.ratePlanId)!.push(rate)
    }

    // 5. Verificar que cada rate plan tiene todas las noches
    const ratePlanQuotes: RatePlanQuoteDto[] = []
    
    for (const [ratePlanId, rates] of ratePlanGroups) {
      // Si este rate plan no cubre todas las noches, saltearlo
      if (rates.length !== nightsNeeded) {
        continue
      }

      // Crear cotización para este rate plan
      const firstRate = rates[0]
      const segments: QuoteSegmentDto[] = []
      let totalPrice = 0

      for (const rate of rates) {
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

      const averageNightlyRate = totalPrice / nightsNeeded

      ratePlanQuotes.push({
        ratePlan: {
          id: firstRate.ratePlanId,
          name: firstRate.ratePlanName,
          code: firstRate.ratePlanCode,
          isRefundable: firstRate.isRefundable || false,
          includedServices: firstRate.includedServices,
          advancePurchaseDays: firstRate.advancePurchaseDays,
          cancellationDeadlineHours: firstRate.cancellationDeadlineHours,
          cancellationPenaltyType: firstRate.cancellationPenaltyType,
          cancellationPenaltyValue: firstRate.cancellationPenaltyValue ? parseFloat(firstRate.cancellationPenaltyValue.toString()) : undefined
        },
        totalNights: nightsNeeded,
        segments,
        totalPrice: Math.round(totalPrice * 100) / 100,
        averageNightlyRate: Math.round(averageNightlyRate * 100) / 100
      })
    }

    // 6. Verificar si tenemos al menos un rate plan disponible
    if (ratePlanQuotes.length === 0) {
      return {
        available: false,
        rejection: {
          roomType: roomTypeInfo,
          reasonCode: RejectionReasonCode.NO_RATES_CONFIGURED,
          reasonMessage: `Sin rate plans disponibles para el período completo (${nightsNeeded} noches)`
        }
      }
    }

    // 7. Calcular percentage difference from base (BAR)
    const barQuote = ratePlanQuotes.find(q => q.ratePlan.code === 'BAR')
    if (barQuote) {
      for (const quote of ratePlanQuotes) {
        if (quote.ratePlan.code !== 'BAR') {
          const percentageDiff = ((quote.totalPrice - barQuote.totalPrice) / barQuote.totalPrice) * 100
          quote.percentageDifferenceFromBase = Math.round(percentageDiff * 100) / 100
        }
      }
    }

    // 8. Crear cotización exitosa con múltiples rate plans
    return {
      available: true,
      quote: {
        roomType: roomTypeInfo,
        ratePlans: ratePlanQuotes
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