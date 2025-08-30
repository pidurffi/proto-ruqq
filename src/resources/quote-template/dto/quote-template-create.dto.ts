import { OmitType } from '@nestjs/swagger'
import { QuoteTemplate } from '../entities/quote-template.entity'

export class QuoteTemplateCreateDto extends OmitType(QuoteTemplate, [
  'id',
  'uid',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {}
