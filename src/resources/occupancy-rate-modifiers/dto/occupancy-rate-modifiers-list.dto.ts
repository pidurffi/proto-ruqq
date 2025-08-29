import { ApiProperty } from '@nestjs/swagger'
import { OccupancyRateModifiers } from '../entities/occupancy-rate-modifiers.entity'

export class OccupancyRateModifiersListDto extends OccupancyRateModifiers {
  @ApiProperty({
    description: 'Total de registros',
    example: 1,
  })
  total: number
}
