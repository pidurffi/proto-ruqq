import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsEnum, IsPositive } from 'class-validator'
import { ModifierType } from '../entities/occupancy-rate-modifiers.entity'

export class OccupancyRateModifiersCreateDto {
  @ApiProperty({
    description: 'ID del período de tarifa base',
    example: '8070914c-6e11-48e5-bca6-763b6ab7fcf2'
  })
  @IsNotEmpty()
  baseRatePeriodId: string

  @ApiProperty({
    description: 'Valor del modificador (precio fijo o porcentaje)',
    example: 15000
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsNotEmpty()
  modifierValue: number

  @ApiProperty({
    description: 'Tipo de modificador',
    enum: ModifierType,
    example: ModifierType.FIXED
  })
  @IsEnum(ModifierType)
  @IsNotEmpty()
  modifierType: ModifierType
}
