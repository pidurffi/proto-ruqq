import { PartialType } from '@nestjs/swagger'
import { RatePlanCreateDto } from './rate-plan-create.dto'

export class RatePlanUpdateDto extends PartialType(RatePlanCreateDto) {}
