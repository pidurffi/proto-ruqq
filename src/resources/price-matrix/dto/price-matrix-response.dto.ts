import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO para respuesta de matriz de precios
 * 
 * ESTRUCTURA DE DATOS:
 * - Matriz optimizada para visualización en frontend
 * - Filas = Tipos de habitación (room types)
 * - Columnas = Fechas del período solicitado
 * - Celdas = Precio final calculado por el Motor de Precios v2.3
 */

/**
 * Información básica de un tipo de habitación
 */
export class RoomTypeInfoDto {
  @ApiProperty({
    description: 'ID único del tipo de habitación',
    example: 'b8e7f2a1-4c3d-4e5f-6789-012345678901'
  })
  id: string

  @ApiProperty({
    description: 'Nombre del tipo de habitación',
    example: 'Suite Premium'
  })
  name: string

  @ApiProperty({
    description: 'Código corto del tipo de habitación',
    example: 'STE_PREM'
  })
  code: string

  @ApiProperty({
    description: 'Capacidad base incluida en el precio',
    example: 2
  })
  baseCapacity: number

  @ApiProperty({
    description: 'Capacidad máxima permitida',
    example: 4
  })
  maxCapacity: number
}

/**
 * Precio calculado para una fecha específica
 */
export class PriceCellDto {
  @ApiProperty({
    description: 'Fecha de la noche (formato YYYY-MM-DD)',
    example: '2025-01-15'
  })
  date: string

  @ApiProperty({
    description: 'Precio final por noche calculado por el Motor v2.3',
    example: 350.00
  })
  price: number

  @ApiProperty({
    description: 'Indica si hay tarifa disponible para esta fecha',
    example: true
  })
  available: boolean

  @ApiProperty({
    description: 'Fuente del precio aplicado',
    example: 'price_rule',
    enum: ['base_rate', 'price_rule', 'promotion'],
    required: false
  })
  source?: 'base_rate' | 'price_rule' | 'promotion'

  @ApiProperty({
    description: 'ID de la regla o período que aplicó (debugging)',
    example: 'rule-123-456',
    required: false
  })
  appliedRuleId?: string
}

/**
 * Fila completa de la matriz para un tipo de habitación
 */
export class PriceMatrixRowDto {
  @ApiProperty({
    description: 'Información del tipo de habitación',
    type: RoomTypeInfoDto
  })
  roomType: RoomTypeInfoDto

  @ApiProperty({
    description: 'Array de precios por fecha (columnas de la matriz)',
    type: [PriceCellDto]
  })
  prices: PriceCellDto[]

  @ApiProperty({
    description: 'Precio promedio para este tipo de habitación en el período',
    example: 325.50
  })
  averagePrice: number

  @ApiProperty({
    description: 'Precio mínimo encontrado',
    example: 280.00
  })
  minPrice: number

  @ApiProperty({
    description: 'Precio máximo encontrado', 
    example: 450.00
  })
  maxPrice: number
}

/**
 * Respuesta completa de la matriz de precios
 */
export class PriceMatrixResponseDto {
  @ApiProperty({
    description: 'Fecha de inicio de la matriz',
    example: '2025-01-01'
  })
  startDate: string

  @ApiProperty({
    description: 'Fecha de fin de la matriz',
    example: '2025-01-31'
  })
  endDate: string

  @ApiProperty({
    description: 'Array de fechas (encabezados de columnas)',
    example: ['2025-01-01', '2025-01-02', '2025-01-03'],
    type: [String]
  })
  dateHeaders: string[]

  @ApiProperty({
    description: 'Filas de la matriz (una por tipo de habitación)',
    type: [PriceMatrixRowDto]
  })
  rows: PriceMatrixRowDto[]

  @ApiProperty({
    description: 'Resumen estadístico de la matriz',
    type: 'object',
    properties: {
      totalRoomTypes: { type: 'number', example: 5 },
      totalDays: { type: 'number', example: 31 },
      averagePriceAcrossAll: { type: 'number', example: 312.75 },
      priceRange: {
        type: 'object',
        properties: {
          min: { type: 'number', example: 150.00 },
          max: { type: 'number', example: 500.00 }
        }
      }
    }
  })
  summary: {
    totalRoomTypes: number
    totalDays: number
    averagePriceAcrossAll: number
    priceRange: {
      min: number
      max: number
    }
  }
}