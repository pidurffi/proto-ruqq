import { PartialType } from '@nestjs/swagger'
import { QuoteTemplateCreateDto } from './quote-template-create.dto'

export class QuoteTemplateUpdateDto extends PartialType(QuoteTemplateCreateDto) {}
