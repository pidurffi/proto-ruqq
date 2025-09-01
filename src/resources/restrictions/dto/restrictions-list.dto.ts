import { ApiProperty } from '@nestjs/swagger'
import { Restrictions } from '../entities/restrictions.entity'

export class RestrictionsListDto extends Restrictions {
  @ApiProperty({
    description: 'Total de registros',
    example: 1,
  })
  total: number
}
