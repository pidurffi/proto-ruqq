import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsDateString, IsInt, Min, Max, IsUUID } from 'class-validator'

/**
 * DTO para solicitud de generación de presupuesto formateado
 * Extiende la funcionalidad del QuoteBudgetDto agregando templateId
 */
export class QuoteGeneratorRequestDto {
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
    description: 'ID de la plantilla de presupuesto a utilizar',
    example: 'uuid-template-id'
  })
  @IsUUID()
  @IsNotEmpty()
  templateId: string
}