import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsBoolean, IsOptional, IsNumber, IsIn, IsNotEmpty } from 'class-validator'

export class RatePlanCreateDto {
  @ApiProperty({
    description: 'Nombre descriptivo del plan de tarifas',
    example: 'Con Desayuno Incluido'
  })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({
    description: 'Código único del rate plan',
    example: 'BB'
  })
  @IsString()
  @IsNotEmpty()
  code: string

  @ApiProperty({
    description: 'Descripción detallada del rate plan y sus condiciones',
    example: 'Tarifa con desayuno buffet incluido',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({
    description: 'Permite cancelación con reembolso',
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isRefundable?: boolean

  @ApiProperty({
    description: 'Días mínimos de anticipación requeridos para reservar',
    example: 7,
    required: false
  })
  @IsNumber()
  @IsOptional()
  advancePurchaseDays?: number

  @ApiProperty({
    description: 'Servicios incluidos: breakfast, dinner, spa_access, etc.',
    example: 'breakfast',
    required: false
  })
  @IsString()
  @IsOptional()
  includedServices?: string

  @ApiProperty({
    description: 'ID del rate plan padre para planes derivados',
    example: 'uuid-del-rate-plan-padre',
    required: false
  })
  @IsString()
  @IsOptional()
  parentRatePlanId?: string

  @ApiProperty({
    description: 'Porcentaje de ajuste respecto al parent rate plan',
    example: -10.00,
    required: false
  })
  @IsNumber()
  @IsOptional()
  parentAdjustmentPercent?: number

  @ApiProperty({
    description: 'Estancia mínima por defecto para este rate plan',
    example: 2,
    required: false
  })
  @IsNumber()
  @IsOptional()
  defaultMinStay?: number

  @ApiProperty({
    description: 'Horas antes del check-in para cancelar sin penalidad',
    example: 24,
    required: false
  })
  @IsNumber()
  @IsOptional()
  cancellationDeadlineHours?: number

  @ApiProperty({
    description: 'Tipo de penalidad de cancelación',
    example: 'PERCENTAGE',
    enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FIRST_NIGHT', 'FULL_STAY'],
    required: false
  })
  @IsString()
  @IsOptional()
  @IsIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FIRST_NIGHT', 'FULL_STAY'])
  cancellationPenaltyType?: string

  @ApiProperty({
    description: 'Valor de la penalidad',
    example: 50.00,
    required: false
  })
  @IsNumber()
  @IsOptional()
  cancellationPenaltyValue?: number

  @ApiProperty({
    description: 'Orden de visualización en interfaces',
    example: 1,
    required: false
  })
  @IsNumber()
  @IsOptional()
  displayOrder?: number

  @ApiProperty({
    description: 'Código para integración con channel managers y OTAs',
    example: 'BB_BOOKING',
    required: false
  })
  @IsString()
  @IsOptional()
  bookingEngineCode?: string
}
