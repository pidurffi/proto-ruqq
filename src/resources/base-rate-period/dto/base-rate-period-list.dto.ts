import { ApiProperty } from '@nestjs/swagger'
import { BaseRatePeriod } from '../entities/base-rate-period.entity'

export class BaseRatePeriodListDto extends BaseRatePeriod {
  @ApiProperty({
    description: 'Total de registros',
    example: 1,
  })
  total: number
}
