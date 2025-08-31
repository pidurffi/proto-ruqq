import { OmitType } from '@nestjs/swagger'
import { QuoteGenerator } from '../entities/quote-generator.entity'

export class QuoteGeneratorCreateDto extends OmitType(QuoteGenerator, [
  'id',
  'uid',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {}
