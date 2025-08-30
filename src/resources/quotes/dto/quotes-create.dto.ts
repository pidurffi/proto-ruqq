import { OmitType } from '@nestjs/swagger'
import { Quotes } from '../entities/quotes.entity'

export class QuotesCreateDto extends OmitType(Quotes, [
  'id',
  'uid',
  'createdAt',
  'deletedAt',
  'updatedAt',
] as const) {}
