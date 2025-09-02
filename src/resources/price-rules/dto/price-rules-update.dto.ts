import { PartialType } from '@nestjs/swagger'
import { CreatePriceRuleDto } from './price-rules-create.dto'

export class UpdatePriceRuleDto extends PartialType(CreatePriceRuleDto) {}
