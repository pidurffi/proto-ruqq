import { IsArray, IsDateString, IsEnum, IsNumber, IsUUID, Min, Max } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { AdjustmentType } from '../../../common/enums/adjustment-type.enum'

export class CalendarBulkEditDto {
  @ApiProperty({ 
    description: 'IDs de tipos de habitación a modificar',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    type: [String]
  })
  @IsArray()
  @IsUUID(4, { each: true })
  roomTypeIds: string[]

  @ApiProperty({ 
    description: 'Fecha de inicio del período',
    example: '2024-01-01'
  })
  @IsDateString()
  startDate: string

  @ApiProperty({ 
    description: 'Fecha de fin del período',
    example: '2024-01-31'
  })
  @IsDateString()
  endDate: string

  @ApiProperty({ 
    description: 'Días de la semana a modificar (ISO 8601: Lunes=1, ..., Domingo=7)',
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
    example: 25.0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  adjustmentValue: number
}