import { ApiProperty } from '@nestjs/swagger'
import { QuoteSegmentDto } from './quotes-budget.dto'

/**
 * DTO que representa la información básica de un rate plan
 */
export class RatePlanInfoDto {
  @ApiProperty({
    description: 'ID único del rate plan',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  id: string

  @ApiProperty({
    description: 'Nombre descriptivo del rate plan',
    example: 'Con Desayuno Incluido'
  })
  name: string

  @ApiProperty({
    description: 'Código único del rate plan',
    example: 'BB'
  })
  code: string

  @ApiProperty({
    description: 'Permite cancelación con reembolso',
    example: true
  })
  isRefundable: boolean

  @ApiProperty({
    description: 'Servicios incluidos',
    example: 'breakfast',
    required: false
  })
  includedServices?: string

  @ApiProperty({
    description: 'Días mínimos de anticipación requeridos',
    example: 7,
    required: false
  })
  advancePurchaseDays?: number

  @ApiProperty({
    description: 'Horas antes del check-in para cancelar sin penalidad',
    example: 24,
    required: false
  })
  cancellationDeadlineHours?: number

  @ApiProperty({
    description: 'Tipo de penalidad de cancelación',
    example: 'PERCENTAGE',
    required: false
  })
  cancellationPenaltyType?: string

  @ApiProperty({
    description: 'Valor de la penalidad',
    example: 50.00,
    required: false
  })
  cancellationPenaltyValue?: number
}

/**
 * DTO que representa una cotización específica para un rate plan
 */
export class RatePlanQuoteDto {
  @ApiProperty({
    description: 'Información del rate plan'
  })
  ratePlan: RatePlanInfoDto

  @ApiProperty({
    description: 'Total de noches',
    example: 2
  })
  totalNights: number

  @ApiProperty({
    description: 'Desglose por segmentos de tarifa',
    type: [QuoteSegmentDto]
  })
  segments: QuoteSegmentDto[]

  @ApiProperty({
    description: 'Precio total para este rate plan',
    example: 450.00
  })
  totalPrice: number

  @ApiProperty({
    description: 'Precio promedio por noche',
    example: 225.00
  })
  averageNightlyRate: number

  @ApiProperty({
    description: 'Porcentaje de diferencia respecto al rate plan base (BAR)',
    example: -10.00,
    required: false
  })
  percentageDifferenceFromBase?: number
}