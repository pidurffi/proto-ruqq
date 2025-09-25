/**
 * DateUtils - Utilidad centralizada para manejo de fechas en toda la API
 *
 * PRINCIPIOS FUNDAMENTALES:
 * 1. Solo trabajar con strings YYYY-MM-DD para fechas de negocio
 * 2. Nunca usar Date objects para lógica de negocio (solo para "hoy")
 * 3. Ignorar completamente las horas (solo fechas)
 * 4. Evitar problemas de timezone usando fecha local
 * 5. Un solo método por responsabilidad
 *
 * REGLA DE ORO: "String in, String out" para fechas de negocio
 */
import { BadRequestException } from '@nestjs/common'

export class DateUtils {
  /**
   * Obtener la fecha actual como string YYYY-MM-DD en timezone local
   * USO: Para validaciones y comparaciones con fechas de negocio
   *
   * @returns string en formato YYYY-MM-DD (ej: "2025-09-25")
   */
  static getTodayAsString(): string {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  /**
   * Validar que una fecha esté en formato YYYY-MM-DD válido
   * USO: Para validaciones de entrada en DTOs
   *
   * @param dateString - String a validar
   * @returns true si es válida, false si no
   *
   * @example
   * DateUtils.isValidDateString('2025-09-25') // true
   * DateUtils.isValidDateString('25/09/2025') // false
   * DateUtils.isValidDateString('2025-13-01') // false
   */
  static isValidDateString(dateString: string): boolean {
    if (!dateString || typeof dateString !== 'string') {
      return false
    }

    // Verificar formato YYYY-MM-DD con regex
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateString)) {
      return false
    }

    // Verificar que sea una fecha real
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day
  }

  /**
   * Comparar dos fechas string (solo fechas, ignora horas)
   * USO: Para validaciones de rango de fechas
   *
   * @param date1 - Primera fecha YYYY-MM-DD
   * @param date2 - Segunda fecha YYYY-MM-DD
   * @returns -1 si date1 < date2, 0 si iguales, 1 si date1 > date2
   *
   * @example
   * DateUtils.compareDateStrings('2025-09-25', '2025-09-26') // -1
   * DateUtils.compareDateStrings('2025-09-25', '2025-09-25') // 0
   * DateUtils.compareDateStrings('2025-09-26', '2025-09-25') // 1
   */
  static compareDateStrings(date1: string, date2: string): number {
    if (!this.isValidDateString(date1) || !this.isValidDateString(date2)) {
      throw new BadRequestException(`Fechas inválidas: ${date1}, ${date2}`)
    }

    if (date1 < date2) return -1
    if (date1 > date2) return 1
    return 0
  }

  /**
   * Calcular número de noches entre dos fechas (checkout exclusive)
   * USO: Para cálculos de precios hoteleros
   *
   * @param checkIn - Fecha de check-in YYYY-MM-DD
   * @param checkOut - Fecha de check-out YYYY-MM-DD
   * @returns Número de noches (días entre fechas)
   *
   * @example
   * DateUtils.calculateNights('2025-09-25', '2025-09-30') // 5
   * DateUtils.calculateNights('2025-09-25', '2025-09-26') // 1
   */
  static calculateNights(checkIn: string, checkOut: string): number {
    if (!this.isValidDateString(checkIn) || !this.isValidDateString(checkOut)) {
      throw new BadRequestException(`Fechas inválidas: checkIn=${checkIn}, checkOut=${checkOut}`)
    }

    if (checkIn >= checkOut) {
      throw new BadRequestException('La fecha de check-in debe ser anterior al check-out')
    }

    // Usar mediodía para evitar problemas de timezone/DST
    const startDate = new Date(checkIn + 'T12:00:00')
    const endDate = new Date(checkOut + 'T12:00:00')

    const diffTime = endDate.getTime() - startDate.getTime()
    return Math.round(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Formatear fecha para mostrar al usuario (DD/MM)
   * USO: Para respuestas formateadas y templates
   *
   * @param dateString - Fecha en formato YYYY-MM-DD
   * @returns Fecha en formato DD/MM
   *
   * @example
   * DateUtils.formatForDisplay('2025-09-25') // '25/09'
   * DateUtils.formatForDisplay('2025-12-01') // '01/12'
   */
  static formatForDisplay(dateString: string): string {
    if (!this.isValidDateString(dateString)) {
      throw new BadRequestException(`Fecha inválida para formatear: ${dateString}`)
    }

    const [year, month, day] = dateString.split('-')
    return `${day}/${month}`
  }

  /**
   * Validar rango de fechas para reservas hoteleras
   * USO: Para validaciones complejas en servicios
   *
   * @param checkIn - Fecha de check-in YYYY-MM-DD
   * @param checkOut - Fecha de check-out YYYY-MM-DD
   * @param options - Opciones de validación
   * @returns void (lanza excepción si hay error)
   *
   * @example
   * DateUtils.validateDateRange('2025-09-25', '2025-09-30')
   * DateUtils.validateDateRange('2025-09-25', '2025-09-30', { allowToday: false })
   */
  static validateDateRange(
    checkIn: string,
    checkOut: string,
    options: {
      allowToday?: boolean
      maxNights?: number
      minNights?: number
    } = {}
  ): void {
    const { allowToday = true, maxNights = 365, minNights = 1 } = options

    // Validar formato
    if (!this.isValidDateString(checkIn)) {
      throw new BadRequestException(`Fecha de check-in inválida: ${checkIn}`)
    }

    if (!this.isValidDateString(checkOut)) {
      throw new BadRequestException(`Fecha de check-out inválida: ${checkOut}`)
    }

    // Validar orden
    if (checkIn >= checkOut) {
      throw new BadRequestException('La fecha de check-in debe ser anterior al check-out')
    }

    // Validar que no sea en el pasado
    const today = this.getTodayAsString()
    const minAllowedDate = allowToday ? today : this.addDays(today, 1)

    if (checkIn < minAllowedDate) {
      const message = allowToday
        ? 'La fecha de check-in no puede ser en el pasado'
        : 'La fecha de check-in debe ser mañana o posterior'
      throw new BadRequestException(message)
    }

    // Validar rango de noches
    const nights = this.calculateNights(checkIn, checkOut)

    if (nights < minNights) {
      throw new BadRequestException(`Mínimo ${minNights} noche${minNights > 1 ? 's' : ''} requerida${minNights > 1 ? 's' : ''}`)
    }

    if (nights > maxNights) {
      throw new BadRequestException(`Máximo ${maxNights} noches permitidas`)
    }
  }

  /**
   * Sumar días a una fecha string
   * USO: Para cálculos internos de fechas
   *
   * @param dateString - Fecha base YYYY-MM-DD
   * @param days - Días a sumar (puede ser negativo para restar)
   * @returns Nueva fecha en formato YYYY-MM-DD
   *
   * @example
   * DateUtils.addDays('2025-09-25', 5)  // '2025-09-30'
   * DateUtils.addDays('2025-09-25', -1) // '2025-09-24'
   */
  static addDays(dateString: string, days: number): string {
    if (!this.isValidDateString(dateString)) {
      throw new BadRequestException(`Fecha inválida: ${dateString}`)
    }

    const date = new Date(dateString + 'T12:00:00') // Mediodía para evitar timezone
    date.setDate(date.getDate() + days)

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  /**
   * Generar array de fechas en un rango (inclusive en start, exclusive en end)
   * USO: Para iteraciones noche por noche
   *
   * @param startDate - Fecha inicial YYYY-MM-DD
   * @param endDate - Fecha final YYYY-MM-DD (exclusiva)
   * @returns Array de fechas string
   *
   * @example
   * DateUtils.getDateRange('2025-09-25', '2025-09-28')
   * // ['2025-09-25', '2025-09-26', '2025-09-27']
   */
  static getDateRange(startDate: string, endDate: string): string[] {
    if (!this.isValidDateString(startDate) || !this.isValidDateString(endDate)) {
      throw new BadRequestException(`Fechas inválidas: ${startDate}, ${endDate}`)
    }

    if (startDate >= endDate) {
      return []
    }

    const dates: string[] = []
    let currentDate = startDate

    while (currentDate < endDate) {
      dates.push(currentDate)
      currentDate = this.addDays(currentDate, 1)
    }

    return dates
  }
}