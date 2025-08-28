import { PartialType } from '@nestjs/swagger'
import { BaseRatePeriodCreateDto } from './base-rate-period-create.dto'

export class BaseRatePeriodUpdateDto extends PartialType(BaseRatePeriodCreateDto) {}
