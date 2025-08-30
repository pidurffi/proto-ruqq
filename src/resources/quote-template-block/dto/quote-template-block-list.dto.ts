import { ApiProperty } from '@nestjs/swagger'
import { QuoteTemplateBlock } from '../entities/quote-template-block.entity'

export class QuoteTemplateBlockListDto extends QuoteTemplateBlock {
  @ApiProperty({
    description: 'Total de registros',
    example: 1,
  })
  total: number
}
