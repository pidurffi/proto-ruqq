import { Inject, Injectable, BadRequestException } from '@nestjs/common'

import { DailyRoomRatesRepository } from '../../daily-room-rates/repositories/daily-room-rates.repository'
import { DailyRatesService } from '../../daily-room-rates/services/daily-room-rates.service'
import { RoomTypeRepository } from '../../room-type/repositories/room-type.repository'
import { QuoteTemplateRepository } from '../../quote-template/repositories/quote-template.repository'
import { ContentBlockRepository } from '../../content-block/repositories/content-block.repository'
import { DataSource } from 'typeorm'
import { resources } from '../../../engine/database/constants'
import { QuoteBudgetDto, QuoteResponseDto, RoomTypeQuoteDto, QuoteSegmentDto, UnavailableRoomTypeDto, RejectionReasonCode } from '../dto'
import { QuoteEngineService } from './quote-engine.service'
import { DateUtils } from '../../../common/utils/date.utils'

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
    @Inject(QuoteTemplateRepository)
    private readonly quoteTemplateRepository: QuoteTemplateRepository,
    @Inject(ContentBlockRepository)
    private readonly contentBlockRepository: ContentBlockRepository,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
    private readonly quoteEngineService: QuoteEngineService,
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

    // PASO B: OBTENER TODAS LAS TARIFAS DEL PERÍODO (1 QUERY SIMPLE) - REFACTORIZADO
    const dailyRates = await this.dailyRatesRepository.findAvailableRatesForPeriod(
      roomType.id,
      checkIn,
      DateUtils.addDays(checkOut, -1), // checkOut -1 día para noches
      1 // Mínimo 1 habitación disponible
    )

    // REFACTORIZADO: Validar que tenemos tarifas para todas las noches necesarias
    const expectedNights = DateUtils.calculateNights(checkIn, checkOut)
    
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

    // PASO E: ¡ÉXITO! - Cotización lista (usando Legacy DTO)
    return {
      isAvailable: true,
      quote: {
        roomType: roomTypeInfo,
        ratePlans: [{
          ratePlan: {
            id: 'legacy-bar',
            name: 'Best Available Rate',
            code: 'BAR',
            isRefundable: true
          },
          totalNights: expectedNights,
          segments,
          totalPrice: Math.round(totalPrice * 100) / 100,
          averageNightlyRate: Math.round((totalPrice / expectedNights) * 100) / 100
        }]
      } as RoomTypeQuoteDto
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

    // REFACTORIZADO: Verificar closed_to_departure en fecha de check-out
    const checkOutDateAdjusted = DateUtils.addDays(checkOut, -1)
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
  // UTILIDADES SIMPLIFICADAS - REFACTORIZADO
  //========================================

  private validateQuoteRequest(checkIn: string, checkOut: string): void {
    // REFACTORIZADO: Usar DateUtils para validación consistente
    DateUtils.validateDateRange(checkIn, checkOut, { allowToday: true })
  }

  private async getAllRoomTypes(): Promise<any[]> {
    // Usar repositorio tenant-aware para obtener room types
    return this.roomTypeRepository.find({
      select: ['id', 'name', 'code', 'baseCapacity', 'maxCapacity']
    })
  }

  /**
   * Generar presupuesto formateado usando template por defecto
   */
  async generateFormattedQuote(quoteBudgetDto: QuoteBudgetDto): Promise<string> {
    // 1. Obtener cotización básica usando QuoteEngineService
    const quote = await this.quoteEngineService.calculateQuote(quoteBudgetDto)

    if (!quote.available || !quote.available.length) {
      throw new BadRequestException('No hay habitaciones disponibles para las fechas seleccionadas')
    }

    // 2. Obtener template por defecto
    const template = await this.quoteTemplateRepository.findOne({
      where: { isDefault: true }
    })

    if (!template) {
      throw new BadRequestException('No se encontró template por defecto')
    }

    // 3. Obtener content blocks de la template en orden
    const templateBlocks = await this.dataSource.query(`
      SELECT cb.content, cb.type, qtb.sort_order
      FROM quote_template_block qtb
      JOIN content_block cb ON qtb.content_block_id = cb.id
      WHERE qtb.quote_template_id = $1 AND qtb.deleted_at IS NULL AND cb.deleted_at IS NULL
      ORDER BY qtb.sort_order ASC
    `, [template.id])

    // 4. Obtener room types con descripciones
    const roomTypesWithDetails = await this.dataSource.query(`
      SELECT id, name, code, description, area_m2, base_capacity
      FROM room_type
      WHERE deleted_at IS NULL
    `)

    // 5. Generar contenido formateado
    let formattedQuote = ''

    // REFACTORIZADO: Usar DateUtils para formateo consistente
    const checkInFormatted = DateUtils.formatForDisplay(quote.checkInDate)
    const checkOutFormatted = DateUtils.formatForDisplay(quote.checkOutDate)

    // REFACTORIZADO: Usar DateUtils para cálculo consistente
    const totalNights = DateUtils.calculateNights(quote.checkInDate, quote.checkOutDate)

    // Para cada room type disponible, generar su descripción
    for (const roomTypeQuote of quote.available) {
      const roomDetails = roomTypesWithDetails.find((rt: any) => rt.id === roomTypeQuote.roomType.id)
      if (!roomDetails) continue

      const ratePlan = roomTypeQuote.ratePlans[0]
      if (!ratePlan) continue

      // Formato específico que pediste
      formattedQuote += `Del ${checkInFormatted} al ${checkOutFormatted}, ${totalNights} noches, para ${quoteBudgetDto.pax}/4 personas:\n`
      formattedQuote += `▷${roomDetails.name}, 2 ambientes, ${roomDetails.area_m2}m²\n`
      formattedQuote += `${roomDetails.description} : $${this.formatPrice(ratePlan.totalPrice)}\n\n`
    }

    // Agregar los content blocks restantes
    for (const block of templateBlocks) {
      if (block.type !== 'GREETING') { // El greeting ya se procesó arriba
        formattedQuote += `${block.content}\n\n`
      }
    }

    return formattedQuote.trim()
  }

  // REFACTORIZADO: Todos los métodos de formateo de fechas eliminados
  // Ahora se usa DateUtils.formatForDisplay() de manera consistente

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }
}