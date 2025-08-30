import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsDateString, IsInt, Min, Max } from 'class-validator'

/**
 * DTO para solicitud de cotización de precios
 * Siguiendo principios de DDD - representa una consulta de dominio
 */
export class QuoteBudgetDto {
  @ApiProperty({
    description: 'Número de huéspedes',
    example: 2,
    minimum: 1,
    maximum: 20
  })
  @IsInt()
  @Min(1)
  @Max(20)
  @IsNotEmpty()
  pax: number

  @ApiProperty({
    description: 'Fecha de check-in',
    example: '2024-10-10'
  })
  @IsDateString()
  @IsNotEmpty()
  checkInDate: Date

  @ApiProperty({
    description: 'Fecha de check-out',
    example: '2024-10-18'
  })
  @IsDateString()
  @IsNotEmpty()
  checkOutDate: Date
}

/**
 * DTO que representa un segmento de tarifa dentro de una cotización
 * Value Object en términos de DDD - encapsula datos inmutables de un segmento
 */
export class QuoteSegmentDto {
  @ApiProperty({
    description: 'Fecha de inicio del segmento',
    example: '2024-10-10'
  })
  startDate: string

  @ApiProperty({
    description: 'Fecha de fin del segmento',
    example: '2024-10-11'
  })
  endDate: string

  @ApiProperty({
    description: 'Precio por noche del segmento',
    example: 200.00
  })
  pricePerNight: number

  @ApiProperty({
    description: 'Número de noches en este segmento',
    example: 2
  })
  nights: number

  @ApiProperty({
    description: 'Subtotal del segmento',
    example: 400.00
  })
  subtotal: number
}

/**
 * DTO que representa la cotización completa para un tipo de habitación
 * Aggregate en términos de DDD - agrupa todos los datos relacionados de la cotización
 */
export class RoomTypeQuoteDto {
  @ApiProperty({
    description: 'Información del tipo de habitación'
  })
  roomType: {
    id: string
    name: string
    code: string
    baseCapacity: number
    maxCapacity: number
  }

  @ApiProperty({
    description: 'Total de noches',
    example: 8
  })
  totalNights: number

  @ApiProperty({
    description: 'Desglose por segmentos de tarifa',
    type: [QuoteSegmentDto]
  })
  segments: QuoteSegmentDto[]

  @ApiProperty({
    description: 'Precio total del presupuesto',
    example: 2132.00
  })
  totalPrice: number
}

/**
 * DTO de respuesta para cotización completa
 * Representa el resultado final del proceso de cotización con todos los tipos disponibles
 */
export class QuoteResponseDto {
  @ApiProperty({
    description: 'Número de huéspedes solicitado',
    example: 2
  })
  pax: number

  @ApiProperty({
    description: 'Fecha de check-in',
    example: '2024-10-10'
  })
  checkInDate: string

  @ApiProperty({
    description: 'Fecha de check-out',
    example: '2024-10-18'
  })
  checkOutDate: string

  @ApiProperty({
    description: 'Array de tipos de habitación disponibles con sus precios',
    type: [RoomTypeQuoteDto]
  })
  availableRoomTypes: RoomTypeQuoteDto[]
}