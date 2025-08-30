import { ApiProperty } from '@nestjs/swagger'
import { Quotes } from '../entities/quotes.entity'

export class QuotesListDto extends Quotes {
  @ApiProperty({
    description: 'Total de registros',
    example: 1,
  })
  total: number
}
