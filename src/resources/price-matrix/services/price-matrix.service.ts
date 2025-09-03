import { Inject, Injectable, BadRequestException } from '@nestjs/common'

import { BaseRatePeriodRepository } from '../../base-rate-period/repositories/base-rate-period.repository'
import { PriceRulesService } from '../../price-rules/services/price-rules.service'
import { 
  PriceMatrixRequestDto, 
  PriceMatrixResponseDto, 
  PriceMatrixRowDto, 
  PriceCellDto, 
  RoomTypeInfoDto 
} from '../dto'

/**
 * PriceMatrixService - Servicio de Dominio para generación de matriz de precios
 * 
 * RESPONSABILIDAD ÚNICA (SRP):
 * - Genera matriz de precios aplicando Motor v2.3 para cada combinación unidad/fecha
 * - Orquesta el cálculo de precios usando capas existentes (base_rate + price_rules)
 * - Mantiene arquitectura extensible para futuras capas (promociones)
 * 
 * DEPENDENCY INVERSION PRINCIPLE (DIP):
 * - Depende de abstracciones (repositories/services) no de implementaciones
 * - Inyección de dependencias para testing y mantenibilidad
 * 
 * MOTOR DE PRECIOS v2.3 APLICADO:
 * - Capa 1: base_rate_period (lienzo base)
 * - Capa 2: price_rules (overrides/calcomanías)
 * - [FUTURO] Capa 3: promociones (descuentos especiales)
 */
@Injectable()
export class PriceMatrixService {
  constructor(
    @Inject(BaseRatePeriodRepository)
    private readonly baseRatePeriodRepository: BaseRatePeriodRepository,
    @Inject(PriceRulesService)
    private readonly priceRulesService: PriceRulesService,
  ) {}

  /**
   * Genera matriz de precios para un rango de fechas
   * 
   * ALGORITMO DE ALTO NIVEL:
   * 1. Validar rango de fechas
   * 2. Obtener todos los room types activos
   * 3. Para cada room type, calcular precios noche por noche
   * 4. Aplicar Motor de Precios v2.3 (base_rate + price_rules)
   * 5. Ensamblar matriz con estadísticas
   * 
   * @param dto Parámetros de la solicitud (startDate, endDate)
   * @returns Matriz completa con precios y estadísticas
   * @throws BadRequestException Si el rango de fechas es inválido
   */
  async generatePriceMatrix(dto: PriceMatrixRequestDto): Promise<PriceMatrixResponseDto> {
    const { startDate, endDate } = dto
    const startDateStr = startDate.toString()
    const endDateStr = endDate.toString()

    // 1. VALIDAR RANGO DE FECHAS
    this.validateDateRange(startDateStr, endDateStr)

    // 2. OBTENER TODOS LOS ROOM TYPES
    const roomTypes = await this.baseRatePeriodRepository.findAllRoomTypes()
    
    if (roomTypes.length === 0) {
      throw new BadRequestException('No se encontraron tipos de habitación configurados')
    }

    // 3. GENERAR ENCABEZADOS DE FECHAS (COLUMNAS)
    const dateHeaders = this.generateDateRange(startDateStr, endDateStr)

    // 4. CALCULAR MATRIZ PARA CADA ROOM TYPE
    const rows: PriceMatrixRowDto[] = []
    let globalMinPrice = Number.MAX_VALUE
    let globalMaxPrice = 0
    let totalPriceSum = 0
    let totalValidPrices = 0

    for (const roomType of roomTypes) {
      const row = await this.calculateRoomTypeRow(
        roomType,
        dateHeaders
      )
      
      rows.push(row)
      
      // Actualizar estadísticas globales
      if (row.minPrice > 0 && row.minPrice < globalMinPrice) {
        globalMinPrice = row.minPrice
      }
      if (row.maxPrice > globalMaxPrice) {
        globalMaxPrice = row.maxPrice
      }
      
      // Sumar precios válidos para promedio global
      row.prices.forEach(cell => {
        if (cell.available && cell.price > 0) {
          totalPriceSum += cell.price
          totalValidPrices++
        }
      })
    }

    // 5. ENSAMBLAR RESPUESTA CON ESTADÍSTICAS
    return {
      startDate: startDateStr,
      endDate: endDateStr,
      dateHeaders,
      rows,
      summary: {
        totalRoomTypes: roomTypes.length,
        totalDays: dateHeaders.length,
        averagePriceAcrossAll: totalValidPrices > 0 ? 
          Math.round((totalPriceSum / totalValidPrices) * 100) / 100 : 0,
        priceRange: {
          min: globalMinPrice === Number.MAX_VALUE ? 0 : globalMinPrice,
          max: globalMaxPrice
        }
      }
    }
  }

  /**
   * Calcula una fila completa de la matriz para un room type específico
   * 
   * ALGORITMO POR ROOM TYPE:
   * 1. Para cada fecha del rango, calcular precio aplicando Motor v2.3
   * 2. Generar estadísticas de la fila (min, max, promedio)
   * 3. Retornar fila completa con metadatos
   * 
   * @param roomType Tipo de habitación a procesar
   * @param dateHeaders Array de fechas a calcular
   * @returns Fila completa con precios y estadísticas
   */
  private async calculateRoomTypeRow(
    roomType: any,
    dateHeaders: string[]
  ): Promise<PriceMatrixRowDto> {
    const roomTypeInfo: RoomTypeInfoDto = {
      id: roomType.id,
      name: roomType.name,
      code: roomType.code,
      baseCapacity: roomType.baseCapacity,
      maxCapacity: roomType.maxCapacity
    }

    const prices: PriceCellDto[] = []
    let validPrices: number[] = []

    // Calcular precio para cada fecha
    for (const date of dateHeaders) {
      const priceCell = await this.calculateSinglePrice(roomType, date)
      prices.push(priceCell)
      
      if (priceCell.available && priceCell.price > 0) {
        validPrices.push(priceCell.price)
      }
    }

    // Calcular estadísticas de la fila
    const averagePrice = validPrices.length > 0 ? 
      Math.round((validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length) * 100) / 100 : 0
    const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0
    const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0

    return {
      roomType: roomTypeInfo,
      prices,
      averagePrice,
      minPrice,
      maxPrice
    }
  }

  /**
   * Calcula el precio para una combinación específica room_type + fecha
   * 
   * MOTOR DE PRECIOS v2.3 APLICADO:
   * 1. Capa Base: Obtener precio de base_rate_period
   * 2. Capa Override: Aplicar price_rule si existe
   * 3. [FUTURO] Capa Promoción: Aplicar descuentos especiales
   * 
   * CAPACIDAD BASE ASUMIDA:
   * - Para la matriz, calculamos precio para capacidad base del room type
   * - Esto evita complejidad de modificadores por ocupación en la vista
   * 
   * @param roomType Tipo de habitación
   * @param date Fecha específica (YYYY-MM-DD)
   * @returns Celda de precio con metadatos
   */
  private async calculateSinglePrice(
    roomType: any,
    date: string
  ): Promise<PriceCellDto> {
    try {
      // PASO 1: Obtener precio base de base_rate_period
      const basePrice = await this.getBasePriceForNight(roomType.id, date)
      
      if (!basePrice) {
        return {
          date,
          price: 0,
          available: false
        }
      }

      // PASO 2: Aplicar price_rule si existe (Capa Override)
      const currentDate = new Date(date)
      const priceRule = await this.priceRulesService.findApplicableRule(
        roomType.id,
        currentDate
      )

      let finalPrice = basePrice.price
      let source: 'base_rate' | 'price_rule' | 'promotion' = 'base_rate'
      let appliedRuleId = basePrice.periodId

      if (priceRule) {
        finalPrice = this.priceRulesService.calculateAdjustedPrice(
          basePrice.price,
          priceRule
        )
        source = 'price_rule'
        appliedRuleId = priceRule.id
      }

      // PASO 3: [FUTURO] Aplicar promociones aquí
      // const promotion = await this.promotionsService.findApplicablePromotion(roomType.id, date)
      // if (promotion) {
      //   finalPrice = this.promotionsService.calculatePromotionalPrice(finalPrice, promotion)
      //   source = 'promotion'
      //   appliedRuleId = promotion.id
      // }

      return {
        date,
        price: Math.round(finalPrice * 100) / 100,
        available: true,
        source,
        appliedRuleId
      }

    } catch (error) {
      // En caso de error, retornar celda no disponible
      return {
        date,
        price: 0,
        available: false
      }
    }
  }

  /**
   * Obtiene el precio base para una noche específica desde base_rate_period
   * 
   * REUTILIZACIÓN DE LÓGICA:
   * - Misma lógica que QuotesService para consistencia
   * - Mantiene coherencia en el Motor de Precios
   * 
   * @param roomTypeId ID del tipo de habitación
   * @param date Fecha específica
   * @returns Precio base y ID del período o null si no hay tarifa
   */
  private async getBasePriceForNight(
    roomTypeId: string,
    date: string
  ): Promise<{ price: number; periodId: string } | null> {
    const periods = await this.baseRatePeriodRepository.findRelevantPeriods(
      roomTypeId,
      date,
      this.addDays(date, 1)
    )

    if (periods.length === 0) {
      return null
    }

    const period = periods[0]
    return {
      price: Number(period.price),
      periodId: period.id
    }
  }

  /**
   * Valida que el rango de fechas sea lógico y no exceda límites
   * 
   * REGLAS DE NEGOCIO:
   * - Fecha inicio debe ser anterior a fecha fin
   * - Rango máximo permitido (evitar sobrecarga del servidor)
   * - Extensible para más validaciones
   * 
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @throws BadRequestException Si el rango es inválido
   */
  private validateDateRange(startDate: string, endDate: string): void {
    if (startDate >= endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin'
      )
    }

    // Limitar rango máximo para evitar sobrecarga (ej: 1 año)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysDiff > 365) {
      throw new BadRequestException(
        'El rango máximo permitido es de 365 días'
      )
    }

    if (daysDiff < 1) {
      throw new BadRequestException(
        'El rango mínimo es de 1 día'
      )
    }
  }

  /**
   * Genera array de fechas entre startDate y endDate (inclusivo)
   * 
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns Array de fechas en formato YYYY-MM-DD
   */
  private generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = []
    let currentDate = new Date(startDate)
    const endDateObj = new Date(endDate)

    while (currentDate <= endDateObj) {
      dates.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  /**
   * Suma días a una fecha string manteniendo formato YYYY-MM-DD
   * 
   * @param dateString Fecha en formato YYYY-MM-DD
   * @param days Número de días a sumar
   * @returns Nueva fecha en formato YYYY-MM-DD
   */
  private addDays(dateString: string, days: number): string {
    const date = new Date(dateString)
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }
}