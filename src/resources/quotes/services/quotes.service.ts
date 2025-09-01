import { Inject, Injectable, BadRequestException } from '@nestjs/common'

import { BaseRatePeriodRepository } from '../../base-rate-period/repositories/base-rate-period.repository'
import { QuoteBudgetDto, QuoteResponseDto, RoomTypeQuoteDto, QuoteSegmentDto, UnavailableRoomTypeDto, RejectionReasonCode } from '../dto'

/**
 * QuotesService - Servicio de Dominio para cálculo de cotizaciones
 * 
 * RESPONSABILIDAD ÚNICA (SRP):
 * - Orquesta el proceso de cotización de precios de alto nivel
 * - NO maneja persistencia de datos (eso es responsabilidad del Repository)
 * - NO maneja lógica de split de tarifas (eso es responsabilidad de BaseRatePeriodService)
 * 
 * DEPENDENCY INVERSION PRINCIPLE (DIP):
 * - Depende de abstracciones (Repository) no de implementaciones concretas
 * - Inyección de dependencias para facilitar testing y mantenibilidad
 * 
 * DOMAIN-DRIVEN DESIGN:
 * - Representa un Servicio de Dominio que orquesta múltiples agregados
 * - Implementa casos de uso de negocio específicos del dominio de cotizaciones
 * - Mantiene la lógica de negocio separada de concerns técnicos
 */
@Injectable()
export class QuotesService {
  constructor(
    @Inject(BaseRatePeriodRepository)
    private readonly baseRatePeriodRepository: BaseRatePeriodRepository,
  ) {}

  /**
   * Calcula una cotización completa para una estadía
   * 
   * CASO DE USO DE DOMINIO:
   * 1. Valida la consulta según reglas de negocio
   * 2. Encuentra tipos de habitación válidos por capacidad
   * 3. Calcula precios aplicando modificadores por ocupación
   * 4. Retorna cotización estructurada para el cliente
   * 
   * PRINCIPIO ABIERTO/CERRADO (OCP):
   * - Extensible para nuevos tipos de modificadores (Tarifas Derivadas, Promociones)
   * - Cerrado para modificación de la lógica base
   * 
   * @param quoteBudgetDto Consulta de cotización validada
   * @returns Cotización completa con opciones disponibles
   * @throws BadRequestException Si la consulta es inválida
   */
  async calculateQuote(quoteBudgetDto: QuoteBudgetDto): Promise<QuoteResponseDto> {
    const { pax, checkInDate, checkOutDate } = quoteBudgetDto
    const checkIn = checkInDate.toString()
    const checkOut = checkOutDate.toString()

    // Validación de reglas de negocio de dominio
    this.validateQuoteRequest(checkIn, checkOut)

    // 1. OBTENER TODOS LOS TIPOS DE HABITACIÓN (ya no pre-filtramos)
    const allRoomTypes = await this.baseRatePeriodRepository.findAllRoomTypes()

    if (allRoomTypes.length === 0) {
      throw new BadRequestException('No se encontraron tipos de habitación configurados en el sistema')
    }

    // 2. PROCESAR CADA TIPO DE HABITACIÓN Y CLASIFICAR
    const available: RoomTypeQuoteDto[] = []
    const unavailable: UnavailableRoomTypeDto[] = []

    for (const roomType of allRoomTypes) {
      const result = await this.evaluateRoomTypeAvailability(roomType, checkIn, checkOut, pax)
      
      if (result.isAvailable) {
        available.push(result.quote!)
      } else {
        unavailable.push(result.rejection!)
      }
    }

    // 3. FASE DE RESPUESTA - Ensamblar resultado final con información completa
    return {
      pax,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      available,
      unavailable
    }
  }

  /**
   * Valida las reglas de negocio para una solicitud de cotización
   * 
   * SINGLE RESPONSIBILITY:
   * - Se encarga únicamente de validar reglas de dominio
   * - Separado de la lógica de cálculo principal
   * 
   * @param checkIn Fecha de entrada
   * @param checkOut Fecha de salida
   * @throws BadRequestException Si las fechas no cumplen las reglas
   */
  private validateQuoteRequest(checkIn: string, checkOut: string): void {
    if (checkIn >= checkOut) {
      throw new BadRequestException(
        'La fecha de check-in debe ser anterior a la fecha de check-out'
      )
    }

    // EXTENSIBLE: Aquí se pueden agregar más validaciones de negocio
    // - Validar fechas mínimas de anticipación
    // - Validar restricciones de temporada
    // - Validar límites de duración de estadía
  }

  /**
   * Evalúa la disponibilidad de un tipo de habitación y retorna el resultado clasificado
   * 
   * NUEVA LÓGICA DE EVALUACIÓN:
   * - Verifica paso a paso cada restricción
   * - Retorna información específica sobre el motivo de rechazo
   * - Mejora la UX proporcionando transparencia total
   * 
   * @param roomType Tipo de habitación a evaluar
   * @param checkIn Fecha de entrada
   * @param checkOut Fecha de salida  
   * @param pax Número de huéspedes
   * @returns Resultado con disponibilidad y cotización o motivo de rechazo
   */
  private async evaluateRoomTypeAvailability(
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
          reasonMessage: `La cantidad de huéspedes (${pax}) excede la capacidad máxima (${roomType.maxCapacity}).`
        }
      }
    }

    // PASO B: Verificar restricciones de estadía
    const restrictions = await this.baseRatePeriodRepository.findApplicableRestrictions(
      roomType.id,
      checkIn,
      checkOut
    )

    const nights = this.calculateNightsBetween(checkIn, this.subtractDays(checkOut, 1))

    for (const restriction of restrictions) {
      // Verificar estancia mínima
      if (restriction.minLengthOfStay && nights < restriction.minLengthOfStay) {
        return {
          isAvailable: false,
          rejection: {
            roomType: roomTypeInfo,
            reasonCode: RejectionReasonCode.MIN_STAY_NOT_MET,
            reasonMessage: `La estancia mínima requerida para estas fechas es de ${restriction.minLengthOfStay} noches.`
          }
        }
      }

      // Verificar estancia máxima
      if (restriction.maxLengthOfStay && nights > restriction.maxLengthOfStay) {
        return {
          isAvailable: false,
          rejection: {
            roomType: roomTypeInfo,
            reasonCode: RejectionReasonCode.MAX_STAY_EXCEEDED,
            reasonMessage: `La estancia máxima permitida para estas fechas es de ${restriction.maxLengthOfStay} noches.`
          }
        }
      }

      // Verificar closed to arrival
      if (restriction.closedToArrival && this.dateInRange(checkIn, restriction.startDate.toString(), restriction.endDate.toString())) {
        return {
          isAvailable: false,
          rejection: {
            roomType: roomTypeInfo,
            reasonCode: RejectionReasonCode.CLOSED_TO_ARRIVAL,
            reasonMessage: `No se permiten check-ins en la fecha ${checkIn}.`
          }
        }
      }

      // Verificar closed to departure
      if (restriction.closedToDeparture && this.dateInRange(checkOut, restriction.startDate.toString(), restriction.endDate.toString())) {
        return {
          isAvailable: false,
          rejection: {
            roomType: roomTypeInfo,
            reasonCode: RejectionReasonCode.CLOSED_TO_DEPARTURE,
            reasonMessage: `No se permiten check-outs en la fecha ${checkOut}.`
          }
        }
      }
    }

    // PASO C: Verificar disponibilidad de tarifas y calcular precio
    const quote = await this.calculateRoomTypeQuote(roomType, checkIn, checkOut, pax)
    
    if (!quote || quote.segments.length === 0) {
      return {
        isAvailable: false,
        rejection: {
          roomType: roomTypeInfo,
          reasonCode: RejectionReasonCode.NO_RATES_CONFIGURED,
          reasonMessage: 'No existen tarifas configuradas para todo el período solicitado.'
        }
      }
    }

    // PASO D: ¡Éxito! Habitación disponible
    return {
      isAvailable: true,
      quote
    }
  }

  /**
   * Calcula la cotización para un tipo de habitación específico
   * 
   * DOMAIN LOGIC (SIMPLIFICADO):
   * - Se asume que las restricciones ya fueron validadas en evaluateRoomTypeAvailability
   * - Aplica modificadores por ocupación siguiendo reglas de negocio  
   * - Calcula precios por segmento respetando períodos tarifarios
   * - Maneja lógica híbrida de precios (fijo vs porcentaje)
   * 
   * @param roomType Tipo de habitación a cotizar
   * @param checkIn Fecha de entrada
   * @param checkOut Fecha de salida
   * @param pax Número de huéspedes
   * @returns Cotización completa para este tipo de habitación o null si no hay tarifas
   */
  private async calculateRoomTypeQuote(
    roomType: any,
    checkIn: string,
    checkOut: string,
    pax: number
  ): Promise<RoomTypeQuoteDto | null> {
    // BUSCAR PERÍODOS TARIFARIOS
    const relevantPeriods = await this.baseRatePeriodRepository.findRelevantPeriods(
      roomType.id,
      checkIn,
      checkOut
    )

    const segments: QuoteSegmentDto[] = []
    let totalPrice = 0
    let totalNights = 0

    // Procesar cada período tarifario
    for (const period of relevantPeriods) {
      const segment = await this.calculatePeriodSegment(
        period,
        checkIn,
        checkOut,
        roomType,
        pax
      )

      if (segment) {
        segments.push(segment)
        totalPrice += segment.subtotal
        totalNights += segment.nights
      }
    }

    return {
      roomType: {
        id: roomType.id,
        name: roomType.name,
        code: roomType.code,
        baseCapacity: roomType.baseCapacity,
        maxCapacity: roomType.maxCapacity
      },
      totalNights,
      segments,
      totalPrice: Math.round(totalPrice * 100) / 100 // Redondeo financiero
    }
  }

  /**
   * Calcula un segmento individual de cotización para un período tarifario
   * 
   * BUSINESS RULES IMPLEMENTATION:
   * - Aplica modificadores por ocupación extra
   * - Respeta límites de fechas del período
   * - Calcula noches exactas sin contar día de checkout
   * 
   * @param period Período tarifario base
   * @param checkIn Fecha de entrada solicitada
   * @param checkOut Fecha de salida solicitada  
   * @param roomType Tipo de habitación
   * @param pax Número de huéspedes
   * @returns Segmento de cotización o null si no aplica
   */
  private async calculatePeriodSegment(
    period: any,
    checkIn: string,
    checkOut: string,
    roomType: any,
    pax: number
  ): Promise<QuoteSegmentDto | null> {
    const periodStart = period.startDate.toString()
    const periodEnd = period.endDate.toString()

    // Calcular intersección de fechas efectivas
    const segmentStart = checkIn > periodStart ? checkIn : periodStart
    const segmentEnd = checkOut <= periodEnd ? 
      this.subtractDays(checkOut, 1) : // Checkout no cuenta como noche
      periodEnd

    // Validar que hay noches en este segmento
    if (segmentStart > segmentEnd) {
      return null
    }

    const nights = this.calculateNightsBetween(segmentStart, segmentEnd)
    let pricePerNight = Number(period.price)

    // DOMAIN LOGIC: Aplicar modificadores por ocupación extra
    if (pax > roomType.baseCapacity) {
      pricePerNight = await this.applyOccupancyModifiers(
        period.id,
        pricePerNight,
        pax - roomType.baseCapacity
      )
    }

    const subtotal = nights * pricePerNight

    return {
      startDate: segmentStart,
      endDate: segmentEnd,
      pricePerNight: Math.round(pricePerNight * 100) / 100,
      nights,
      subtotal: Math.round(subtotal * 100) / 100
    }
  }

  /**
   * Aplica modificadores por ocupación extra según reglas de negocio
   * 
   * STRATEGY PATTERN IMPLEMENTATION:
   * - Soporta múltiples tipos de modificadores (fixed, percentage)
   * - Extensible para nuevos tipos de modificadores
   * 
   * @param periodId ID del período tarifario
   * @param basePrice Precio base por noche
   * @param extraPax Número de huéspedes adicionales
   * @returns Precio por noche modificado
   */
  private async applyOccupancyModifiers(
    periodId: string,
    basePrice: number,
    extraPax: number
  ): Promise<number> {
    const modifiers = await this.baseRatePeriodRepository.findOccupancyModifiers(periodId)
    let modifiedPrice = basePrice

    // Aplicar cada modificador según su tipo
    for (const modifier of modifiers) {
      if (modifier.modifierType === 'fixed') {
        // Precio fijo por pasajero extra
        modifiedPrice += extraPax * Number(modifier.modifierValue)
      } else if (modifier.modifierType === 'percentage') {
        // Porcentaje sobre precio base por pasajero extra
        const percentageIncrease = (Number(modifier.modifierValue) / 100) * basePrice
        modifiedPrice += extraPax * percentageIncrease
      }
    }

    return modifiedPrice
  }

  /**
   * Resta días a una fecha string manteniendo formato YYYY-MM-DD
   * 
   * UTILITY METHOD:
   * - Maneja fechas en UTC para evitar problemas de zona horaria
   * - Mantiene consistencia con el formato de la base de datos
   * 
   * @param dateString Fecha en formato YYYY-MM-DD
   * @param days Número de días a restar
   * @returns Nueva fecha en formato YYYY-MM-DD
   */
  private subtractDays(dateString: string, days: number): string {
    const date = new Date(dateString + 'T00:00:00.000Z')
    date.setUTCDate(date.getUTCDate() - days)
    return date.toISOString().split('T')[0]
  }

  /**
   * Calcula noches entre dos fechas (ambas inclusivas)
   * 
   * BUSINESS RULE:
   * - Ambas fechas son inclusivas para el cálculo
   * - Maneja correctamente diferencias de zona horaria
   * 
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns Número de noches
   */
  private calculateNightsBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate + 'T00:00:00.000Z')
    const end = new Date(endDate + 'T00:00:00.000Z')
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1 // +1 porque ambas fechas son inclusivas
  }

  /**
   * Verifica si una fecha está dentro de un rango específico
   * 
   * @param date Fecha a verificar
   * @param startDate Fecha de inicio del rango
   * @param endDate Fecha de fin del rango
   * @returns true si la fecha está dentro del rango
   */
  private dateInRange(date: string, startDate: string, endDate: string): boolean {
    return date >= startDate && date <= endDate
  }
}