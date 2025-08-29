import { PartialType } from '@nestjs/swagger'
import { OccupancyRateModifiersCreateDto } from './occupancy-rate-modifiers-create.dto'

export class OccupancyRateModifiersUpdateDto extends PartialType(OccupancyRateModifiersCreateDto) {}
