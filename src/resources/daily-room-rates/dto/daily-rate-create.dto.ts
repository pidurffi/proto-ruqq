import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsEnum, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

import { PricingSource } from '../constants'

/**
 * DTO para crear/actualizar tarifas diarias
 * Simplificado vs BaseRatePeriodCreateDto (sin rangos complejos)
 */
export class DailyRateCreateDto {
  @ApiProperty({
    description: 'ID del tipo de habitación',
    example: 'uuid-room-type'
  })
  @IsNotEmpty()
  roomTypeId: string

  @ApiProperty({
    description: 'Fecha específica para la tarifa',
    example: '2025-07-15'
  })
  @IsDateString()
  @IsNotEmpty()
  date: Date

  @ApiProperty({
    description: 'Precio base para la capacidad estándar',
    example: 150.00
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(50000)
  @Type(() => Number)
  baseRate: number

  @ApiProperty({
    description: 'Precio especial para ocupación individual (opcional)',
    example: 120.00,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(50000)
  @Type(() => Number)
  singleOccupancyRate?: number

  @ApiProperty({
    description: 'Precio adicional por persona extra',
    example: 30.00,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  @Type(() => Number)
  extraPersonRate?: number

  @ApiProperty({
    description: 'Habitaciones disponibles para este día',
    example: 5
  })
  @IsNumber()
  @Min(0)
  @Max(1000)
  @Type(() => Number)
  availableRooms: number

  @ApiProperty({
    description: 'Día vendible (activo)',
    example: true,
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true

  @ApiProperty({
    description: 'Estancia mínima requerida para check-ins en este día',
    example: 2,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  @Type(() => Number)
  minStay?: number

  @ApiProperty({
    description: 'Estancia máxima permitida para check-ins en este día',
    example: 14,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  maxStay?: number

  @ApiProperty({
    description: 'No se permiten check-ins en este día (CTA)',
    example: false,
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  closedToArrival?: boolean = false

  @ApiProperty({
    description: 'No se permiten check-outs en este día (CTD)',
    example: false,
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  closedToDeparture?: boolean = false

  @ApiProperty({
    description: 'Origen del precio para tracking',
    example: 'manual',
    required: false,
    enum: PricingSource
  })
  @IsOptional()
  @IsEnum(PricingSource)
  pricingSource?: PricingSource
}