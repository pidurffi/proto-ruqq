import { PartialType } from '@nestjs/swagger'
import { QuotesCreateDto } from './quotes-create.dto'

export class QuotesUpdateDto extends PartialType(QuotesCreateDto) {}
