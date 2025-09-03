import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, Max } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { AdjustmentType } from '../../../common/enums/adjustment-type.enum'

export class CreatePriceRuleDto {
  @ApiProperty({ 
    description: 'ID del tipo de habitación',
    example: 'uuid-room-type-id'
  })
  @IsUUID()
  roomTypeId: string

  @ApiProperty({ 
    description: 'Fecha de inicio de la regla',
    example: '2024-01-01'
  })
  @IsDateString()
  startDate: Date

  @ApiProperty({ 
    description: 'Fecha de fin de la regla',
    example: '2024-01-31'
  })
  @IsDateString()
  endDate: Date

  @ApiProperty({ 
    description: 'Días de la semana (ISO 8601: Lunes=1, ..., Domingo=7)',
    example: [6, 7],
    type: [Number]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  daysOfWeek: number[]

  @ApiProperty({ 
    description: 'Prioridad de la regla (mayor número = mayor prioridad)',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number

  @ApiProperty({ 
    description: 'Tipo de ajuste de precio',
    enum: AdjustmentType,
    example: AdjustmentType.PERCENTAGE
  })
  @IsEnum(AdjustmentType)
  adjustmentType: AdjustmentType

  @ApiProperty({ 
    description: 'Valor del ajuste (precio fijo, cantidad o porcentaje)',
    example: 15.50
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  adjustmentValue: number
}

export class BulkCreatePriceRuleDto {
  @ApiProperty({ 
    description: 'IDs de tipos de habitación',
    example: ['uuid-1', 'uuid-2'],
    type: [String]
  })
  @IsArray()
  @IsUUID(4, { each: true })
  roomTypeIds: string[]

  @ApiProperty({ 
    description: 'Fecha de inicio de la regla',
    example: '2024-01-01'
  })
  @IsDateString()
  startDate: Date

  @ApiProperty({ 
    description: 'Fecha de fin de la regla',
    example: '2024-01-31'
  })
  @IsDateString()
  endDate: Date

  @ApiProperty({ 
    description: 'Días de la semana (ISO 8601: Lunes=1, ..., Domingo=7)',
    example: [6, 7],
    type: [Number]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  daysOfWeek: number[]

  @ApiProperty({ 
    description: 'Tipo de ajuste de precio',
    enum: AdjustmentType,
    example: AdjustmentType.PERCENTAGE
  })
  @IsEnum(AdjustmentType)
  adjustmentType: AdjustmentType

  @ApiProperty({ 
    description: 'Valor del ajuste (precio fijo, cantidad o porcentaje)',
    example: 15.50
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  adjustmentValue: number

  @ApiProperty({ 
    description: 'Prioridad de la regla (mayor número = mayor prioridad)',
    example: 0,
    required: false,
    default: 0
  })
  @IsNumber({}, { message: 'Priority debe ser un número' })
  @Min(0)
  @IsOptional()
  priority?: number
}
