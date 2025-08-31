import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO de respuesta para presupuesto formateado
 * Contiene el texto final listo para copiar y pegar
 */
export class QuoteGeneratorResponseDto {
  @ApiProperty({
    description: 'Presupuesto formateado como texto completo',
    example: `Estimado cliente,\n\nNos complace presentarle nuestra propuesta para su estadía...\n\nHabitación Standard: $200 por noche\nHabitación Premium: $350 por noche\n\nGracias por elegirnos.`
  })
  formattedQuote: string

  @ApiProperty({
    description: 'Nombre de la plantilla utilizada',
    example: 'Presupuesto Estándar WhatsApp'
  })
  templateName: string
}