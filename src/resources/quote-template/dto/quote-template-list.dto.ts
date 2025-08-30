import { ApiProperty } from '@nestjs/swagger'
import { QuoteTemplate } from '../entities/quote-template.entity'

export class QuoteTemplateListDto extends QuoteTemplate {
  @ApiProperty({
    description: 'Total de registros',
    example: 1,
  })
  total: number
}
