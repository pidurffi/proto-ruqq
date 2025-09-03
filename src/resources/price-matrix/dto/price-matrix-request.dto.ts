import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsNotEmpty } from 'class-validator'

/**
 * DTO para solicitud de matriz de precios
 * 
 * RESPONSABILIDAD:
 * - Definir parámetros de entrada para generar matriz de precios
 * - Validar rangos de fechas con reglas de negocio
 * - Mantener API simple y extensible
 */
export class PriceMatrixRequestDto {
  @ApiProperty({
    description: 'Fecha de inicio para la matriz de precios',
    example: '2025-01-01',
    type: 'string',
    format: 'date'
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: Date

  @ApiProperty({
    description: 'Fecha de fin para la matriz de precios',
    example: '2025-01-31',
    type: 'string', 
    format: 'date'
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: Date
}