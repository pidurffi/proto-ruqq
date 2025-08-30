import { OmitType } from '@nestjs/swagger'
import { QuoteTemplateBlock } from '../entities/quote-template-block.entity'

export class QuoteTemplateBlockCreateDto extends OmitType(QuoteTemplateBlock, [
  'id',
  'uid',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {}
