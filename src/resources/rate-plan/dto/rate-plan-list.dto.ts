import { ApiProperty } from '@nestjs/swagger'
import { RatePlan } from '../entities/rate-plan.entity'

export class RatePlanListDto extends RatePlan {
  @ApiProperty({
    description: 'Total de registros',
    example: 1,
  })
  total: number
}
