import { Inject, Injectable, BadRequestException } from '@nestjs/common'

import { DailyRoomRatesRepository } from '../../daily-room-rates/repositories/daily-room-rates.repository'
import { DailyRatesService } from '../../daily-room-rates/services/daily-room-rates.service'
import { 
  PriceMatrixRequestDto, 
  PriceMatrixResponseDto, 
  PriceMatrixRowDto, 
  PriceCellDto, 
  RoomTypeInfoDto 
} from '../dto'

/**
 * PriceMatrixService - REFACTORIZADO para modelo OTA diario
 * 
 * SIMPLIFICACIÓN MASIVA:
 * - ANTES: Motor v2.3 complejo con múltiples capas (base_rate + price_rules + promociones)
 * - AHORA: Query directo a daily_room_rates
 * 
 * ELIMINAMOS COMPLETAMENTE:
 * ❌ "Motor de Precios v2.3" y su lógica de capas
 * ❌ Orquestación entre BaseRatePeriodRepository + PriceRulesService
 * ❌ Conceptos de "lienzo base" y "calcomanías"
 * ❌ Lógica compleja de aplicación de overrides
 * 
 * NUEVA LÓGICA ULTRA-SIMPLE:
 * ✅ Una consulta: daily_room_rates para rango de fechas
 * ✅ Precios ya calculados y almacenados
 * ✅ Compatible 100% con APIs de OTAs
 * ✅ Reducción masiva de complejidad
 */
@Injectable()
export class PriceMatrixService {
  constructor(
    @Inject(DailyRoomRatesRepository)
    private readonly dailyRatesRepository: DailyRoomRatesRepository,
    @Inject(DailyRatesService)
    private readonly dailyRatesService: DailyRatesService,
  ) {}

  /**
   * Genera matriz de precios - VERSIÓN ULTRA-SIMPLIFICADA
   * 
   * ANTES: Algoritmo complejo con Motor v2.3 (base_rate + price_rules)
   * AHORA: Query directo a daily_room_rates
   * 
   * ALGORITMO SIMPLE:
   * 1. Validar rango de fechas
   * 2. Obtener room types
   * 3. Query daily_room_rates para toda la matriz
   * 4. Ensamblar respuesta
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

    // 2. OBTENER TODOS LOS ROOM TYPES (desde daily_room_rates)
    const roomTypes = await this.dailyRatesRepository.findAllRoomTypes()
    
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
   * Calcula fila de matriz - SIMPLIFICADO
   * 
   * ANTES: Motor v2.3 complejo aplicado fecha por fecha
   * AHORA: Query bulk para todas las fechas del room type
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

    // NUEVA LÓGICA SIMPLE: Query bulk para todas las fechas
    const startDate = dateHeaders[0]
    const endDate = dateHeaders[dateHeaders.length - 1]
    const dailyRates = await this.dailyRatesRepository.findRatesForPeriod(
      roomType.id,
      startDate,
      endDate
    )

    const prices: PriceCellDto[] = []
    let validPrices: number[] = []

    // Mapear fechas a precios
    for (const date of dateHeaders) {
      const rate = dailyRates.find(r => r.date.toISOString().split('T')[0] === date)
      
      if (rate && rate.availableRooms > 0) {
        const price = Number(rate.baseRate)
        prices.push({
          date,
          price,
          available: true,
          source: 'daily_rate',
          appliedRuleId: rate.id
        })
        validPrices.push(price)
      } else {
        prices.push({
          date,
          price: 0,
          available: false
        })
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