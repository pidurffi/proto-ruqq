import { ApiProperty } from '@nestjs/swagger'
import { PriceRule } from '../entities/price-rules.entity'

export class PriceRulesListDto extends PriceRule {
  @ApiProperty({
    description: 'Total de registros',
    example: 1,
  })
  total: number
}
