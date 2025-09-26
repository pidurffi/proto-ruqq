import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsDateString, IsInt, Min, Max, IsOptional, IsUUID } from 'class-validator'
import { UnavailableRoomTypeDto } from './rejection-reason.dto'

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

  @ApiProperty({
    description: 'ID del template a utilizar (opcional, usa el template por defecto si no se especifica)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false
  })
  @IsOptional()
  @IsUUID()
  templateId?: string
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
 * DTO que representa la información básica de un room type
 */
export class RoomTypeInfoDto {
  @ApiProperty({
    description: 'ID único del room type',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  id: string

  @ApiProperty({
    description: 'Nombre del tipo de habitación',
    example: 'Suite'
  })
  name: string

  @ApiProperty({
    description: 'Código del tipo de habitación',
    example: 'SUI'
  })
  code: string

  @ApiProperty({
    description: 'Capacidad base del room type',
    example: 2
  })
  baseCapacity: number

  @ApiProperty({
    description: 'Capacidad máxima del room type',
    example: 4
  })
  maxCapacity: number
}

/**
 * DTO que representa la cotización completa para un tipo de habitación con múltiples rate plans
 * Aggregate en términos de DDD - agrupa todos los datos relacionados de la cotización
 */
export class RoomTypeQuoteDto {
  @ApiProperty({
    description: 'Información del tipo de habitación'
  })
  roomType: RoomTypeInfoDto

  @ApiProperty({
    description: 'Array de rate plans disponibles para este room type',
    isArray: true
  })
  ratePlans: any[] // Cambiamos a any[] temporalmente para evitar circular dependency
}

/**
 * DTO LEGACY - Mantenido para compatibilidad hacia atrás
 * @deprecated Usar RoomTypeQuoteDto con múltiples rate plans
 */
export class LegacyRoomTypeQuoteDto {
  @ApiProperty({
    description: 'Información del tipo de habitación'
  })
  roomType: RoomTypeInfoDto

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
 * Representa el resultado final del proceso de cotización con habitaciones disponibles y no disponibles
 * MEJORA UX: Proporciona información transparente sobre por qué ciertas habitaciones no están disponibles
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
  available: RoomTypeQuoteDto[]

  @ApiProperty({
    description: 'Array de tipos de habitación no disponibles con motivos específicos',
    type: [UnavailableRoomTypeDto]
  })
  unavailable: UnavailableRoomTypeDto[]
}