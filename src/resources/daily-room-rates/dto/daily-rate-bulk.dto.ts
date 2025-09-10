import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsEnum, Min, Max, ValidateIf, IsArray, IsInt } from 'class-validator'
import { Type } from 'class-transformer'

import { PricingSource } from '../constants'

/**
 * DTO para operaciones bulk - configurar tarifas para un rango de fechas
 * Esta es la diferencia clave: una operación simple reemplaza toda la lógica de split
 */
export class DailyRateBulkDto {
  @ApiProperty({
    description: 'ID del tipo de habitación',
    example: 'uuid-room-type'
  })
  @IsNotEmpty()
  roomTypeId: string

  @ApiProperty({
    description: 'Fecha de inicio del rango',
    example: '2025-07-01'
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: Date

  @ApiProperty({
    description: 'Fecha de fin del rango',
    example: '2025-07-31'
  })
  @IsDateString()
  @IsNotEmpty()
  @ValidateIf((o) => new Date(o.endDate) >= new Date(o.startDate))
  endDate: Date

  @ApiProperty({
    description: 'Precio base para todo el rango',
    example: 150.00
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(50000)
  @Type(() => Number)
  baseRate: number

  @ApiProperty({
    description: 'Habitaciones disponibles por día',
    example: 5
  })
  @IsNumber()
  @Min(0)
  @Max(1000)
  @Type(() => Number)
  availableRooms: number

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
    description: 'Estancia mínima para todo el rango',
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
    description: 'Estancia máxima para todo el rango',
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
    description: 'Aplicar CTA (cerrado a llegadas) a todo el rango',
    example: false,
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  closedToArrival?: boolean = false

  @ApiProperty({
    description: 'Aplicar CTD (cerrado a salidas) a todo el rango',
    example: false,
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  closedToDeparture?: boolean = false

  @ApiProperty({
    description: 'Origen del pricing para tracking',
    example: 'bulk_import',
    required: false,
    enum: PricingSource
  })
  @IsOptional()
  @IsEnum(PricingSource)
  pricingSource?: PricingSource = PricingSource.BULK_IMPORT

  @ApiProperty({
    description: 'Filtro de días de semana para aplicar cambios (JavaScript standard: 0=Domingo, 1=Lunes, ..., 6=Sábado)',
    example: [5, 6],
    required: false,
    type: [Number],
    items: {
      type: 'number',
      minimum: 0,
      maximum: 6
    }
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  dayOfWeekFilter?: number[]
}