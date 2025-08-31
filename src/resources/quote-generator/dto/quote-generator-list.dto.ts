import { ApiProperty } from '@nestjs/swagger'
import { QuoteGenerator } from '../entities/quote-generator.entity'

export class QuoteGeneratorListDto extends QuoteGenerator {
  @ApiProperty({
    description: 'Total de registros',
    example: 1,
  })
  total: number
}
